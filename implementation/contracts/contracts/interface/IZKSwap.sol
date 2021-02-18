// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.6;

interface SharedTypes {
    struct Balance {
		uint64 ethAmount;
		uint64 tokenAmount;
		uint64 nonce;
		address from;
	}
}

interface IZkSwap is SharedTypes {
	event BalanceUpdate(address _from, uint ethAmount, uint tokenAmount, uint nonce);
	event Length(uint len);


	function verifyTrade(
		SharedTypes.Balance[] memory incomingBalances,
		uint direction,
		uint ethDelta,
		uint tokenDelta,
		uint[2] calldata a,
		uint[2][2] calldata b,
		uint[2] calldata c, 
		uint[2] calldata input
	) external payable;
	
	function depositEth(bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce) external payable;

	function firstDepositEth(bytes32[] memory balanceProof) external payable;

	function depositERC20(bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint depositAmount) external;

	function firstDepositERC20(bytes32[] memory balanceProof, uint depositAmount) external;

	function withdrawEth(bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint withdrawAmount) external;

	function withdrawERC20(bytes32[] memory balanceProof, uint ethAmount, uint tokenAmount, uint nonce, uint withdrawAmount) external;
	
	receive() external payable;
}