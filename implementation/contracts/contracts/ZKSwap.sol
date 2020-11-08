// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract ZkSwap {

	bytes32 public addressBook = 0xe3d4879dd9a5530315210a62ccfcb361e4d19093e27212732cbb24d43774df2a; // initial root with 1 set account and 3 zero accounts

	constructor()
        public
    {}

	event Registered(address _from);

	function register(bytes32[] memory proof, bytes32 oldLeaf)
	 	public 
		returns (bool) 
	{
		require(checkInputs(proof, oldLeaf));
		require(verifyMerkle(proof, addressBook, oldLeaf));
		updateMerkle(proof, keccak256(abi.encodePacked(msg.sender)));
		emit Registered(msg.sender);
	}

	function verifyMerkle(bytes32[] memory proof, bytes32 root, bytes32 leaf) 
		internal 
		pure
		returns (bool) 
	{
        return computeMerkle(proof, leaf) == root;
    }

	function updateMerkle(bytes32[] memory proof, bytes32 leaf)
		internal
	{
		addressBook = computeMerkle(proof, leaf);
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
		require(leaf == keccak256(abi.encodePacked(address(0x0)))); // makes sure the oldLeaf is empty
		require(
			(proof[0] != keccak256(abi.encodePacked(address(0x0))) && proof[1] == emptyLeafPairHash) || // if the leaf pair is not empty, the following pair must be a emptyLeafPairHash
			(proof[0] == keccak256(abi.encodePacked(address(0x0))) && proof[1] != emptyLeafPairHash) // if the leafPait is empty, the next hash pait cant be empty
		);
		return true;
	}
}
