// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./openzeppelin/token/ERC20/IERC20.sol";

contract ZkSwap {

	bytes32 public users = 0xe5425043ec286e19667f244de46c46f85e91713c2778a0d60508cf2f3e0773fb; // initial root with 1 set account and 3 zero accounts
	bytes32 public balances = 0x2a6a0b55abf1014b619d8be55afb8567f90c2af0b2f85ca9bd7c1cfa9eb8d0a0;
	address public erc20;
	enum CurrecyType { Ether, Bat }

	modifier canUpdateBalance(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce)
	{
		require(verifyUserMerkle(userProof, sha256(abi.encodePacked(msg.sender)))); // makes sure sender is registered
 		require(verifyBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount, tokenAmount, nonce)))); // checks if passed balance amount is correct
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
		require(checkInputs(proof, oldLeaf), "Inputs not valid!");
		require(verifyUserMerkle(proof, oldLeaf), "User proof not valid!");
		updateUserMerkle(proof, sha256(abi.encodePacked(msg.sender)));
		emit Registered(msg.sender);
	}
	
	function depositEth(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce)
		public
		payable
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		updateBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount + msg.value, tokenAmount, nonce)));
		emit Deposit(msg.sender, ethAmount + msg.value, tokenAmount);
	}

	function depositERC20(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint depositAmount)
		public
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		IERC20(erc20).transferFrom(msg.sender, address(this), depositAmount);
		updateBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount, tokenAmount + depositAmount, nonce)));
		emit Deposit(msg.sender, ethAmount, tokenAmount + depositAmount);
	}

	function withdrawEth(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint withdrawAmount)
		public
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		require(ethAmount >= withdrawAmount);
		updateBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount - withdrawAmount, tokenAmount, nonce)));
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
		updateBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount, tokenAmount - withdrawAmount, nonce)));
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
            computedHash = sha256(abi.encodePacked(computedHash, proofElement));
        }
		return computedHash;
	}

	function checkInputs(bytes32[] memory proof, bytes32 leaf)
		internal
		pure
		returns (bool)
	{
		bytes32 emptyLeafPairHash = 0x4d7553877a80ec8d79a231713605b91f4207522d7c452062ce173eb9f61a02c8;
		require(leaf == sha256(abi.encodePacked(address(0x0)))); // makes sure the oldLeaf is empty => Not overwriting another account
		require(
			(proof[0] != sha256(abi.encodePacked(address(0x0))) && proof[1] == emptyLeafPairHash) || // if the leaf pair is not empty, the following pair must be a emptyLeafPairHash
			(proof[0] == sha256(abi.encodePacked(address(0x0))) && proof[1] != emptyLeafPairHash) // if the leafPait is empty, the next hash pait cant be empty
		);
		return true;
	}
}
