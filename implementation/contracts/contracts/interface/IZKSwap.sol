// SPDX-License-Identifier: MIT
pragma experimental ABIEncoderV2;
pragma solidity ^0.7.6;

library SharedTypes {
    struct Balance {
		uint64 ethAmount;
		uint64 tokenAmount;
		uint64 nonce;
		address from;
	}
}

interface IZkSwap {
	event BalanceUpdate(address _from, uint ethAmount, uint tokenAmount, uint nonce);
	event Success(bool yeah); 
	function verifyTrade(
		SharedTypes.Balance[] memory incomingBalances,
		uint64 direction,
		uint64 ethDelta,
		uint64 tokenDelta,
		bytes32 newRoot,
		uint[2] calldata a,
		uint[2][2] calldata b,
		uint[2] calldata c, 
		uint[2] memory dataHash
	) external payable;
}