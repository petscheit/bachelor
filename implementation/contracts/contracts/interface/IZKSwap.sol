// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.6;

interface SharedTypes {
    struct Balance {
		uint ethAmount;
		uint tokenAmount;
		uint nonce;
		address from;
	}
}

interface IZkSwap is SharedTypes {
	event Registered(address _from);
	event BalanceUpdate(address _from, uint ethAmount, uint tokenAmount, uint nonce);

	function verifyTrade(
		SharedTypes.Balance[] calldata incomingBalances,
		uint direction,
		uint ethDelta,
		uint tokenDelta,
		uint[2] calldata a,
		uint[2][2] calldata b,
		uint[2] calldata c, 
		uint[2] calldata input
	) external payable;

	function register(bytes32[] memory proof, bytes32 oldLeaf) external;
	
	function depositEth(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce) external payable;

	function depositERC20(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint depositAmount) external;

	function withdrawEth(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint withdrawAmount) external;

	function withdrawERC20(bytes32[] memory userProof, bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint withdrawAmount) external;

	receive() external payable;
}