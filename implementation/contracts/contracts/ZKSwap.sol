// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./openzeppelin/token/ERC20/IERC20.sol";

contract ZkSwap {

	bytes32 public users = 0x113f6d6d1b1bf24631064680373348b5004288de46820619289926eb64f8b838; // initial root with 1 set account and 3 zero accounts
	bytes32 public balances = 0x9888c069c7dec5713aa8bc435c9c6c02b909c7e17201989b68a5a5fadb71aa8b;
	address public erc20;
	address public verifier;
	enum CurrecyType { Ether, Bat }

	modifier canUpdateBalance(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce)
	{
		require(verifyUserMerkle(userProof, sha256(abi.encodePacked(msg.sender))), "User merkle couldn't be reproduced!"); // makes sure sender is registered
 		require(verifyBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount, tokenAmount, nonce, uint(0)))), "Balance merkle couldn't be reproduced!"); // checks if passed balance amount is correct
		_;
	}

	constructor(address ercAddr, address verifierAddr)
        public
    {
		erc20 = ercAddr;
		verifier = verifierAddr;
	}

	event Registered(address _from);
	event Deposit(address _from, uint ethAmount, uint tokenAmount);

	event BalanceUpdate(address _from, uint ethAmount, uint tokenAmount, uint nonce);
	
    event Debug(uint amount);

	function register(bytes32[] memory proof, bytes32 oldLeaf)
	 	public 
	{
		require(checkInputs(proof, oldLeaf));
		require(verifyUserMerkle(proof, oldLeaf));
		updateUserMerkle(proof, sha256(abi.encodePacked(msg.sender)));
		emit Registered(msg.sender);
	}
	
	function getSupply()
	    public
	{
	    emit Debug(IERC20(erc20).totalSupply());
	}

	function verifyTrade(uint[] calldata ethAmount, uint[] calldata tokenAmount, uint[] calldata nonce, address[] calldata from, bytes32 shaHash, bytes32 newBalanceRoot)
		external
	{
		// check verifier
		assert(checkTradeData(ethAmount, tokenAmount, nonce, from, shaHash));
		// check msg.value OR ERC20 allowance if needed
		// transfer ERC20 funds to contract
		// update root
		// emit balances
	}

	function checkTradeData(uint[] memory ethAmount, uint[] memory tokenAmount, uint[] memory nonce, address[] memory from, bytes32 shaHash)
		internal
		returns (bool)
	{
		bytes32[] memory _hashes;
		for(uint i = 0; i < ethAmount.length; i++){
			_hashes[i] = sha256(abi.encodePacked(ethAmount[i], tokenAmount[i], nonce[i], from[i]));
		}
		return sha256(abi.encodePacked(_hashes[0], _hashes[1], _hashes[2])) == shaHash;
	}
	
	function depositEth(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce)
		public
		payable
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		updateBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount + (msg.value / 1000000), tokenAmount, nonce, uint(0))));
		emit Deposit(msg.sender, ethAmount + (msg.value / 1000000), tokenAmount);
	}

	function depositERC20(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint depositAmount)
		public
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		IERC20(erc20).transferFrom(msg.sender, address(this), depositAmount);
		updateBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount, tokenAmount + depositAmount, nonce, uint(0))));
		emit Deposit(msg.sender, ethAmount, tokenAmount + depositAmount);
	}

	function withdrawEth(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint withdrawAmount)
		public
		canUpdateBalance(userProof, balanceProof, ethAmount, tokenAmount, nonce)
	{
		require(ethAmount >= withdrawAmount);
		updateBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount - withdrawAmount, tokenAmount, nonce, uint(0))));
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
		updateBalanceMerkle(balanceProof, sha256(abi.encodePacked(ethAmount, tokenAmount - withdrawAmount, nonce, uint(0))));
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
                computedHash = sha256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = sha256(abi.encodePacked(proofElement, computedHash));
            }
        }
		return computedHash;
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
