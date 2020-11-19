// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./openzeppelin/token/ERC20/IERC20.sol";

contract ZkSwap {

	bytes32 public users = 0xe3d4879dd9a5530315210a62ccfcb361e4d19093e27212732cbb24d43774df2a; // initial root with 1 set account and 3 zero accounts
	bytes32 public balances = 0x266f52b16165e9e2253be106c3774931e09bc1aff98955a74814788fbaba6b7f;
	address public erc20;
	enum CurrecyType { Ether, Bat }

	modifier canUpdateBalance(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce)
	{
		require(verifyUserMerkle(userProof, keccak256(abi.encodePacked(msg.sender)))); // makes sure sender is registered
 		require(verifyBalanceMerkle(balanceProof, keccak256(abi.encodePacked(ethAmount, tokenAmount, nonce)))); // checks if passed balance amount is correct
		_;
	}

	constructor(address ercAddr)
        public
    {
		erc20 = ercAddr;
	}

	event Registered(address _from);
	event Deposit(address _from, uint etherAmount, uint tokenAmount);
	
    event Debug(uint amount);

	function register(bytes32[] memory proof, bytes32 oldLeaf)
	 	public 
	{
		require(checkInputs(proof, oldLeaf));
		require(verifyUserMerkle(proof, oldLeaf));
		updateUserMerkle(proof, keccak256(abi.encodePacked(msg.sender)));
		emit Registered(msg.sender);
	}
	
	function getSupply()
	    public
	{
	    emit Debug(IERC20(erc20).totalSupply());
	}
	
	function depositEth(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce)
		public
		payable
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		updateBalanceMerkle(balanceProof, keccak256(abi.encodePacked(ethAmount + msg.value, tokenAmount, nonce)));
		emit Deposit(msg.sender, ethAmount + msg.value, tokenAmount);
	}

	function depositERC20(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint depositAmount)
		public
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		IERC20(erc20).transferFrom(msg.sender, address(this), depositAmount);
		updateBalanceMerkle(balanceProof, keccak256(abi.encodePacked(ethAmount, tokenAmount + depositAmount, nonce)));
		emit Deposit(msg.sender, ethAmount, tokenAmount + depositAmount);
	}

	function withdrawEth(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint withdrawAmount)
		public
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		require(ethAmount >= withdrawAmount);
		updateBalanceMerkle(balanceProof, keccak256(abi.encodePacked(ethAmount - withdrawAmount, tokenAmount, nonce)));
		emit Deposit(msg.sender, ethAmount - withdrawAmount, tokenAmount);
		(bool success, ) = msg.sender.call.value(withdrawAmount)("");
        require(success, "Transfer failed.");		
	}

	function withdrawERC20(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint withdrawAmount)
		public
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		require(tokenAmount >= withdrawAmount);
		IERC20(erc20).transfer(msg.sender, withdrawAmount);
		updateBalanceMerkle(balanceProof, keccak256(abi.encodePacked(ethAmount, tokenAmount - withdrawAmount, nonce)));
		emit Deposit(msg.sender, ethAmount, tokenAmount - withdrawAmount);
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
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
		return computedHash;
	}

	function checkInputs(bytes32[] memory proof, bytes32 leaf)
		internal
		pure
		returns (bool)
	{
		bytes32 emptyLeafPairHash = 0x57570dbcb8388f7a4cb09bf05bcb6c44f46b11a956b25a1b6d50a2d27f2ee71e;
		require(leaf == keccak256(abi.encodePacked(address(0x0)))); // makes sure the oldLeaf is empty => Not overwriting another account
		require(
			(proof[0] != keccak256(abi.encodePacked(address(0x0))) && proof[1] == emptyLeafPairHash) || // if the leaf pair is not empty, the following pair must be a emptyLeafPairHash
			(proof[0] == keccak256(abi.encodePacked(address(0x0))) && proof[1] != emptyLeafPairHash) // if the leafPait is empty, the next hash pait cant be empty
		);
		return true;
	}
}
