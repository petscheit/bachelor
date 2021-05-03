// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.6;
import "./interface/IERC20.sol";
import "./interface/IUniswapV2Router02.sol";
import "./verifier.sol";
import "./interface/IZKSwap.sol";

contract ZkSwap {

	bytes32 public balances = 0x506d86582d252405b840018792cad2bf1259f1ef5aa5f887e13cb2f0094f51e1;
	address public router = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
	address[] public ethToTokenPath = [0xc778417E063141139Fce010982780140Aa0cD5Ab, 0xb87241aAA3E8991C6922E830B61722838cF130fb];
	address[] public tokenToEthPath = [0xb87241aAA3E8991C6922E830B61722838cF130fb, 0xc778417E063141139Fce010982780140Aa0cD5Ab];
	address public erc20;
	address public verifier;

	uint private tradePoolExpiration; // variable used for tracking blocknumber for trade pool sealing;
	uint256 public ethToToken = 0;
	uint256 public tokenToEth = 0;

	modifier canUpdateBalance(address sender, bytes32[] memory balanceProof, uint64 ethAmount, uint64 tokenAmount, uint64 nonce)
	{
 		require(verifyBalanceMerkle(balanceProof, hashBalance(sender, ethAmount, tokenAmount, nonce)), "Balance merkle couldn't be reproduced!"); // checks if passed balance amount is correct
		_;
	}

	constructor(address ercAddr, address verifierAddr)
    {
		erc20 = ercAddr;
		verifier = verifierAddr;
		setTokenAmount();
	}

	event BalanceUpdate(address _from, uint64 ethAmount, uint64 tokenAmount, uint64 nonce);
	event Success(bytes32 yeah);
	event Balance(uint amount);

	function verifyTrade(
		SharedTypes.Balance[] memory incomingBalances,
		uint64 direction,
		uint64 deltaEth,
		uint64 deltaToken,
		bytes32 newRoot,
		uint[2] calldata a,
		uint[2][2] calldata b,
		uint[2] calldata c, 
		uint[2] memory dataHash
	)
		external
		payable
	{	
		require(Verifier(verifier).verifyTx(a, b, c, dataHash), "Proof verification failed!"); // passes
		require(handleTransactorPayment(direction, deltaEth, deltaToken), "Transactor payment failed!"); // passes
		bytes32 result = hashTradeData(incomingBalances, newRoot, deltaEth, deltaToken, direction);
		emit Success(result);
		// require(concatHashes(dataHash[0], dataHash[1]) == result, "Trade data check failed!");
		// emit Success(checkTradeData(incomingBalances, concatHashes(dataHash[0], dataHash[1]), balances, newRoot));
		for(uint i = 0; i < incomingBalances.length; i++) {
			emit BalanceUpdate(incomingBalances[i].from, incomingBalances[i].ethAmount, incomingBalances[i].tokenAmount, incomingBalances[i].nonce); // doesn't fire
		}
		balances = newRoot; // reassigns
		setTokenAmount(); // is called and updates
	}
		

	function hashTradeData(SharedTypes.Balance[] memory incomingBalances, bytes32 newRoot, uint64 deltaEth, uint64 deltaToken, uint64 direction) // reimplement for dynamic array size
		public
		returns (bytes32)
	{	
		bytes32[] memory _hashes = new bytes32[](3);
		for(uint i = 0; i < 3; i++){
			_hashes[i] = hashBalance(incomingBalances[i].from, incomingBalances[i].ethAmount, incomingBalances[i].tokenAmount, incomingBalances[i].nonce);
		}
		bytes32 rootPrice = sha256(abi.encodePacked(balances, newRoot, uint64(ethToToken / 1000000), uint64(tokenToEth / 1000000), deltaEth, deltaToken, uint256(direction)));
		return sha256(abi.encodePacked(_hashes[0], _hashes[1],_hashes[2], rootPrice)); //Hacky, last trade gets hashed twice for ZoKrates compatibility
	}

	function handleTransactorPayment(uint64 direction, uint64 deltaEth, uint64 deltaToken)
		private
		returns (bool)
	{
		if(direction == 0) { // Receiving tokens
			require(_receiveToken(uint(deltaToken) * 1000000, msg.sender), "Tokens couldn't be received!");
			require(_sendEth(uint(deltaEth) * 1000000, payable(msg.sender)), "Eth payment couldn't be sent!");
		} else if(direction == 1) { // receiving ETH
			require((msg.value / 1000000) >= deltaEth, "Amount of Eth received to small!");
			require(_sendToken(deltaToken * 1000000, msg.sender), "Token payment couldn't be sent!");
		}
		return true;
	}

	function setTokenAmount()
		private
	{
		//No slipage defined yet;
		ethToToken = IUniswapV2Router02(router).getAmountsOut(1000000000000000000, ethToTokenPath)[1] / 100;
		tokenToEth = IUniswapV2Router02(router).getAmountsOut(1000000000000000000, tokenToEthPath)[1] / 100;
	}

	function _sendEth(uint amountWei, address payable _to)
		private
		returns (bool)
	{
		(bool sent, ) = _to.call{value: amountWei}("");
        return sent;
	}

	function _sendToken(uint amountWei, address _to)
		private
		returns (bool)
	{
		emit Balance(amountWei);
		return IERC20(erc20).transfer(_to, amountWei);
	}

	function _receiveToken(uint amountWei, address sender)
		private
		returns (bool)
	{
		emit Balance(amountWei);
		return IERC20(erc20).transferFrom(sender, address(this), amountWei);
	}

	function firstDepositEth(bytes32[] memory balanceProof)
		payable
		external
		canUpdateBalance(0x0000000000000000000000000000000000000000, balanceProof, uint64(0), uint64(0), uint64(0)) // ensures we're taking an empty leaf
	{
		updateBalanceMerkle(balanceProof, hashBalance(msg.sender, uint64(msg.value / 1000000), uint64(0), uint64(1)));
		emit BalanceUpdate(msg.sender, uint64((msg.value / 1000000)), uint64(0), uint64(1));
	}

	function depositEth(bytes32[] memory balanceProof, uint64 ethAmount, uint64 tokenAmount, uint64 nonce)
		payable
		public
		canUpdateBalance(msg.sender, balanceProof, ethAmount, tokenAmount, nonce)
	{
		updateBalanceMerkle(balanceProof, hashBalance(msg.sender, uint64(ethAmount + (msg.value / 1000000)), tokenAmount, nonce + 1));
		emit BalanceUpdate(msg.sender, uint64(ethAmount + (msg.value / 1000000)), tokenAmount, nonce + 1);
	}

	function firstDepositERC20(bytes32[] memory balanceProof, uint64 depositAmount)
		external
		canUpdateBalance(0x0000000000000000000000000000000000000000, balanceProof, uint64(0), uint64(0), uint64(0)) // ensures we're taking an empty leaf
	{
		require(_receiveToken(uint(depositAmount) * 1000000, msg.sender));
		updateBalanceMerkle(balanceProof, hashBalance(msg.sender, uint64(0), depositAmount, uint64(1)));
		emit BalanceUpdate(msg.sender, uint64(0), depositAmount, uint64(1));
	}

	function depositERC20(bytes32[] memory balanceProof, uint64 ethAmount, uint64 tokenAmount, uint64 nonce, uint64 depositAmount)
		external
		canUpdateBalance(msg.sender, balanceProof, ethAmount, tokenAmount, nonce)
	{
		emit Balance(depositAmount);
		require(_receiveToken(uint(depositAmount) * 1000000, msg.sender));
		updateBalanceMerkle(balanceProof, hashBalance(msg.sender, ethAmount, tokenAmount + depositAmount, nonce + 1));
		emit BalanceUpdate(msg.sender, ethAmount, tokenAmount + depositAmount, nonce + 1);
	}

	function withdrawEth(bytes32[] memory balanceProof, uint64 ethAmount, uint64 tokenAmount, uint64 nonce, uint64 withdrawAmount)
		external
		canUpdateBalance(msg.sender, balanceProof, ethAmount, tokenAmount, nonce)
	{
		require(ethAmount >= withdrawAmount);
		updateBalanceMerkle(balanceProof, hashBalance(msg.sender, ethAmount - withdrawAmount, tokenAmount, nonce + 1));
		emit BalanceUpdate(msg.sender, ethAmount - withdrawAmount, tokenAmount, nonce + 1);
		require(_sendEth(uint(withdrawAmount) * 1000000, payable(msg.sender)));
	}

	function withdrawERC20(bytes32[] memory balanceProof, uint64 ethAmount, uint64 tokenAmount, uint64 nonce, uint64 withdrawAmount)
		external
		canUpdateBalance(msg.sender, balanceProof, ethAmount, tokenAmount, nonce)
	{
		require(tokenAmount >= withdrawAmount);
		emit Balance(withdrawAmount);
		require(_sendToken(uint(withdrawAmount) * 1000000, msg.sender));
		updateBalanceMerkle(balanceProof, hashBalance(msg.sender, ethAmount, tokenAmount - withdrawAmount, nonce + 1));
		emit BalanceUpdate(msg.sender, ethAmount, tokenAmount - withdrawAmount, nonce + 1);
	}

	function hashBalance(address sender, uint64 ethAmount, uint64 tokenAmount, uint64 nonce)
		private
		pure
		returns (bytes32)
	{
		bytes12 padAddress = 0x000000000000000000000000;
		uint64 padAmount = 0;
		return sha256(abi.encodePacked(sender, padAddress, ethAmount, tokenAmount, nonce, padAmount));
	}

	function verifyBalanceMerkle(bytes32[] memory proof, bytes32 leaf) 
		internal 
		view
		returns (bool) 
	{
        return computeMerkle(proof, leaf) == balances;
    }

	function updateBalanceMerkle(bytes32[] memory proof, bytes32 leaf)
		internal
	{

		balances = computeMerkle(proof, leaf);
	}

	function computeMerkle(bytes32[] memory proof, bytes32 leaf) 
		internal
		pure 
		returns (bytes32) 
	{
		bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash <= proofElement) {
                computedHash = sha256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = sha256(abi.encodePacked(proofElement, computedHash));
            }
        }
		return computedHash;
	}
	
	function concatHashes(uint a, uint b)
        private
		pure
        returns (bytes32)
    {
        uint256 result; 
        result = result | a << 128;
		result = result | b;
       return bytes32(result);
    }
}