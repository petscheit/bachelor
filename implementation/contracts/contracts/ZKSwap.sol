// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.6;
import "./interface/IERC20.sol";
import "./interface/IUniswapV2Router02.sol";
import "./verifier.sol";
import "./interface/IZKSwap.sol";

contract ZkSwap is SharedTypes {

	bytes32 public balances = 0x506d86582d252405b840018792cad2bf1259f1ef5aa5f887e13cb2f0094f51e1;
	address public router = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
	address[] public uniswapPath = [0xc778417E063141139Fce010982780140Aa0cD5Ab, 0xb87241aAA3E8991C6922E830B61722838cF130fb];
	address public erc20;
	address public verifier;

	uint private tradePoolExpiration; // variable used for tracking blocknumber for trade pool sealing;
	uint256 public setEthAmount = 1000000000000000000;
	uint256 public setTokenAmount = 0;

	modifier canUpdateBalance(address sender, bytes32[] memory balanceProof, uint64 ethAmount, uint64 tokenAmount, uint64 nonce)
	{
 		require(verifyBalanceMerkle(balanceProof, hashBalance(sender, ethAmount, tokenAmount, nonce)), "Balance merkle couldn't be reproduced!"); // checks if passed balance amount is correct
		_;
	}

	constructor(address ercAddr, address verifierAddr)
    {
		erc20 = ercAddr;
		verifier = verifierAddr;
		setTokenAmount = getTokenAmount();
	}

	event Length(uint len);
	event BalanceUpdate(address _from, uint64 ethAmount, uint64 tokenAmount, uint64 nonce);

	function verifyTrade(
		SharedTypes.Balance[] memory incomingBalances,
		uint64 direction,
		uint64 ethDelta,
		uint64 tokenDelta,
		bytes32 newRoot,
		uint[2] calldata a,
		uint[2][2] calldata b,
		uint[2] calldata c, 
		uint[2] calldata input
	)
		external
		payable
	{		
		emit Length(incomingBalances.length); //doesn't fire
		require(Verifier(verifier).verifyTx(a, b, c, input), "Proof verification failed!"); // passes
		require(handleTransactorPayment(direction, ethDelta, tokenDelta), "Transactor payment failed!"); // passes
		require(checkTradeData(incomingBalances, concatHashes(input[0], input[1]), newRoot));
		for(uint i = 0; i < incomingBalances.length; i++) {
			emit BalanceUpdate(incomingBalances[i].from, incomingBalances[i].ethAmount, incomingBalances[i].tokenAmount, incomingBalances[i].nonce); // doesn't fire
		}
		balances = concatHashes(input[0], input[1]); // reassigns
		setTokenAmount = getTokenAmount(); // is called and updates
	}

	function handleTransactorPayment(uint64 direction, uint64 ethDelta, uint64 tokenDelta)
		private
		returns (bool)
	{
		if(direction == 0) { // Receiving tokens
			require(_receiveToken(tokenDelta * 1000000, msg.sender), "Tokens couldn't be received!");
			require(_sendEth(ethDelta * 1000000, payable(msg.sender)), "Eth payment couldn't be sent!");
		} else if(direction == 1) { // receiving ETH
			require((msg.value / 1000000) >= ethDelta, "Amount of Eth received to small!");
			require(_sendToken(tokenDelta * 1000000, msg.sender), "Token payment couldn't be sent!");
		}
		return true;
	}

	function getTokenAmount()
		private
		view
		returns (uint)
	{
		//No slipage defined yet;
		return IUniswapV2Router02(router).getAmountsOut(setEthAmount, uniswapPath)[1];
	}

	function updateTokenAmount()
		public
	{
		setTokenAmount = getTokenAmount();
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
		return IERC20(erc20).transfer(_to, amountWei);
	}

	function _receiveToken(uint amountWei, address sender)
		private
		returns (bool)
	{
		return IERC20(erc20).transferFrom(sender, address(this), amountWei);
	}

	function checkTradeData(SharedTypes.Balance[] memory incomingBalances, bytes32 dataHash, bytes32 newRoot) // reimplement for dynamic array size
		private
		view
		returns (bool)
	{
		
		bytes32[] memory _hashes = new bytes32[](incomingBalances.length);
		for(uint i = 0; i < incomingBalances.length; i++){
			_hashes[i] = hashBalance(incomingBalances[i].from, incomingBalances[i].ethAmount, incomingBalances[i].tokenAmount, incomingBalances[i].nonce);
		}
		bytes32 balancesHash = sha256(abi.encodePacked(_hashes[0], _hashes[1],_hashes[2], _hashes[2])); //Hacky, last trade gets hashed twice for ZoKrates compatibility
		bytes32 rootPrice = sha256(abi.encodePacked(balances, newRoot, setEthAmount, setTokenAmount));

		return sha256(abi.encodePacked(balancesHash, rootPrice)) == dataHash;
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
		require(_receiveToken(depositAmount * 1000000, msg.sender));
		updateBalanceMerkle(balanceProof, hashBalance(msg.sender, uint64(0), depositAmount, uint64(1)));
		emit BalanceUpdate(msg.sender, uint64(0), depositAmount, uint64(1));
	}

	function depositERC20(bytes32[] memory balanceProof, uint64 ethAmount, uint64 tokenAmount, uint64 nonce, uint64 depositAmount)
		external
		canUpdateBalance(msg.sender, balanceProof, ethAmount, tokenAmount, nonce)
	{
		require(_receiveToken(depositAmount * 1000000, msg.sender));
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
		require(_sendEth(withdrawAmount * 1000000, payable(msg.sender)));
	}

	function withdrawERC20(bytes32[] memory balanceProof, uint64 ethAmount, uint64 tokenAmount, uint64 nonce, uint64 withdrawAmount)
		external
		canUpdateBalance(msg.sender, balanceProof, ethAmount, tokenAmount, nonce)
	{
		require(tokenAmount >= withdrawAmount);
		require(_sendToken(withdrawAmount * 1000000, msg.sender));
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
                // Hash(current computed hash + current element of the proof)
                computedHash = sha256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = sha256(abi.encodePacked(proofElement, computedHash));
            }
        }
		return computedHash;
	}
	
	receive() external payable { // for testing...
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