// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./openzeppelin/token/ERC20/IERC20.sol";
import "./verifier.sol";

contract ZkSwap {

	bytes32 public users = 0x113f6d6d1b1bf24631064680373348b5004288de46820619289926eb64f8b838; // initial root with 1 set account and 3 zero accounts
	bytes32 public balances = 0x92f4853bec2930dcf538f3d620cf297bdcbce51afc7b69b6563fc977afdefd7f;
	address public erc20;
	address public verifier;

	uint private tradePoolExpiration; // variable used for tracking blocknumber for trade pool sealing;
	uint public setEthAmount = 1000000000000;
	uint public setTokenAmout = 20400000000000;


	enum CurrecyType { Ether, Bat }

	modifier canUpdateBalance(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce)
	{
		require(verifyUserMerkle(userProof, sha256(abi.encodePacked(msg.sender))), "User merkle couldn't be reproduced!"); // makes sure sender is registered
 		require(verifyBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount, tokenAmount, nonce))), "Balance merkle couldn't be reproduced!"); // checks if passed balance amount is correct
		_;
	}

	constructor(address ercAddr, address verifierAddr)
        public
    {
		erc20 = ercAddr;
		verifier = verifierAddr;
	}

	event Registered(address _from);
	event Deposit(address _from, uint ethAmount, uint tokenAmount, uint nonce);

	event BalanceUpdate(address _from, uint ethAmount, uint tokenAmount, uint nonce);
	
    event Debug(uint amount);
	
	function getSupply()
	    public
	{
	    emit Debug(IERC20(erc20).totalSupply());
	}

	function verifyTrade(
		uint[] calldata ethAmount, 
		uint[] calldata tokenAmount, 
		uint[] calldata nonce, 
		address[] calldata from, 
		uint[2] calldata a,
		uint[2][2] calldata b,
		uint[2] calldata c, 
		uint[4] calldata input // [0:8]: root, [8:16]: data hash, could hash the root aswell, would reduce validation iteration by 1
	)
		external
		payable
	{		
		// check inputs maybe?
		// assert(checkTradeData(ethAmount, tokenAmount, nonce, from, concatHashes(input[2], input[3]))); // ensures inputs where used as zokrates inputs
		assert(Verifier(verifier).verifyTx(a, b, c, input)); // zkSnark verification
		emitNewBalances(ethAmount, tokenAmount, nonce, from);
		balances = concatHashes(input[0], input[1]);
		//ensure old root is the same (can also hash to test)
		// check msg.value OR ERC20 allowance if needed
		// transfer ERC20 funds to contract
		// emit balances
		updateSetPrice();
	}

	function updateSetPrice()
		private
		returns (uint)
	{
		setTokenAmout = 21000000000000;	
	}

	function emitNewBalances(uint[] memory ethAmount, uint[] memory tokenAmount, uint[] memory nonce, address[] memory from)
		private
	{
		for(uint i = 0; i < ethAmount.length; i++) {
			emit BalanceUpdate(from[i], ethAmount[i], tokenAmount[i], nonce[i]);
		}
	}

	// function checkTradeData(uint[] memory ethAmount, uint[] memory tokenAmount, uint[] memory nonce, address[] memory from, bytes32 shaHash) // reimplement for dynamic array size
	// 	internal
	// 	returns (bool)
	// {
	// 	   uint length = ethAmount.length;
	// 	bytes32[] memory _hashes = new bytes32[](length + 1);
	// 	for(uint i = 0; i < ethAmount.length; i++){
	// 		_hashes[i] = sha256(abi.encode(ethAmount[i], tokenAmount[i], nonce[i], addrs[i]));
	// 	}
	// 	_hashes[length] = sha256(abi.encode(uint(1000000000000), uint(20400000000000)));
	// 	return sha256(abi.encodePacked(_hashes[0], _hashes[1], _hashes[2]));
	// }

	function register(bytes32[] memory proof, bytes32 oldLeaf)
	 	public 
	{
		require(checkInputs(proof, oldLeaf));
		require(verifyUserMerkle(proof, oldLeaf));
		updateUserMerkle(proof, sha256(abi.encodePacked(msg.sender)));
		emit Registered(msg.sender);
	}
	
	function depositEth(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce)
		public
		payable
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		updateBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount + (msg.value / 1000000), tokenAmount, nonce + 1)));
		emit BalanceUpdate(msg.sender, ethAmount + (msg.value / 1000000), tokenAmount, nonce + 1);
	}

	function depositERC20(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint depositAmount)
		public
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		IERC20(erc20).transferFrom(msg.sender, address(this), depositAmount * 1000000);
		updateBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount, tokenAmount + depositAmount, nonce + 1)));
		emit BalanceUpdate(msg.sender, ethAmount, tokenAmount + depositAmount, nonce + 1);
	}

	function withdrawEth(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint withdrawAmount)
		public
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		require(ethAmount >= withdrawAmount);
		updateBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount - withdrawAmount, tokenAmount, nonce + 1)));
		emit BalanceUpdate(msg.sender, ethAmount - withdrawAmount, tokenAmount, nonce + 1);
		(bool success, ) = msg.sender.call.value(withdrawAmount * 1000000)("");
        require(success, "Transfer failed.");		
	}

	function withdrawERC20(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint withdrawAmount)
		public
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		require(tokenAmount >= withdrawAmount);
		IERC20(erc20).transfer(msg.sender, withdrawAmount * 1000000);
		updateBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount, tokenAmount - withdrawAmount, nonce + 1)));
		emit BalanceUpdate(msg.sender, ethAmount, tokenAmount - withdrawAmount, nonce + 1);
	}

	function verifyUserMerkle(bytes32[] memory proof, bytes32 leaf) 
		internal 
		view
		returns (bool) 
	{
        return computeMerkle(proof, leaf) == users;
    }

	function updateUserMerkle(bytes32[] memory proof, bytes32 leaf)
		internal
	{
		users = computeMerkle(proof, leaf);
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

	function concatHashes(uint a, uint b)
        private
        returns (bytes32)
    {
        uint256 result; 
        result = result | a << 128;
		result = result | b;
       return bytes32(result);
    }

	function checkInputs(bytes32[] memory proof, bytes32 leaf)
		internal
		pure
		returns (bool)
	{
		//this doesn't work, need to rethink this
		// bytes32 emptyLeafPairHash = 0x4d7553877a80ec8d79a231713605b91f4207522d7c452062ce173eb9f61a02c8;
		bytes32 zeroAddress = 0xde47c9b27eb8d300dbb5f2c353e632c393262cf06340c4fa7f1b40c4cbd36f90;
		require(leaf == zeroAddress); // makes sure the oldLeaf is empty => Not overwriting another account
		// require(
		// 	(proof[0] != zeroAddress && proof[1] == emptyLeafPairHash) || // if the leaf pair is not empty, the following pair must be a emptyLeafPairHash
		// 	(proof[0] == zeroAddress && proof[1] != emptyLeafPairHash) // if the leafPait is empty, the next hash pait cant be empty
		// );
		return true;
	}
}


// TODO
// -SafeMath
// Ensure inputs maybe?



// ["0x05f8466fcd52efcc4e5e04ee2cd97f13abad304c636d9ea73ead6c46ae7492a1","0xbc4b629401c53d59faf08267e134f7fadc002cf4df6eefdac4e212ddd255be48","0x2a6a0b55abf1014b619d8be55afb8567f90c2af0b2f85ca9bd7c1cfa9eb8d0a0","0xa75302b096a66a65d80ff923dda83e8ca6a29cb9935a10028c850d92a648a4c0","0x7e60b89111726223d0ffdfa7bc7ec24c0dac7cb1a8bc2e84937e5feb872adf2e","0x94cda1ef0455d073efb5421a20752157ee9cfe898c41fd8f7aba0f60f105745a","0xc1f615a1a5d5a49b51949e655d99c9cebd37b0b58d21644bff4769448226f26f","0xfa06218cda9f4c0060657fec0c5c1a360f61d30b97d93c0e983c1755943e2af6"], 4000000000000, 20400000000000, 2