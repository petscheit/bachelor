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
		bytes32 oldRoot,
		bytes32 newRoot,
		uint[2] calldata a,
		uint[2][2] calldata b,
		uint[2] calldata c, 
		uint[2] memory dataHash
	) external payable;
}

// [{\"ethAmount\":\"22892276154\",\"tokenAmount\":\"0\",\"nonce\":\"2\",\"address\":[\"0xcc08e563\",\"0x6A9ceb03\",\"0x917C1ac7\",\"0xBbEda23a\",\"0xD57766F3\"]},
// {\"ethAmount\":\"0\",\"tokenAmount\":\"54603569850000\",\"nonce\":\"2\",\"address\":[\"0x31b87891\",\"0x8679d9DA\",\"0x1DB277B1\",\"0xA2fD67Aa\",\"0x01032920\"]},
// {\"ethAmount\":\"0\",\"tokenAmount\":\"21841427940000\",\"nonce\":\"2\",\"address\":[\"0x1D539b71\",\"0x7035B802\",\"0x40d6e783\",\"0x6B2C752E\",\"0x204B7DD4\"]}]

// [[22892276154, 0, 2, "0xcc08e5636a9ceb03917c1ac7bbeda23ad57766f3"], [0, 54603569850000, 2, "0x31b878918679d9DA1DB277B1A2fD67Aa01032920"], [0, 21841427940000, 2, "0x1D539b717035B80240d6e7836B2C752E204B7DD4"]]