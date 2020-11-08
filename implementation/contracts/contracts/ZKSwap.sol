// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract ZkSwap {

	bytes32 public addressBook = 0x940f4677df688005ff256120a86d431f96c926f884135e28f06041c5aa48194b; // initial root with 4 zero accounts

	constructor()
        public
    {}

	event Registered(address _from);

	function register(bytes32[] memory proof, bytes32 oldLeaf)
	 	public 
		returns (bool) 
	{
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
}



// ["0x5380c7b7ae81a58eb98d9c78de4a1fd7fd9535fc953ed2be602daaa41767312a","0x57570dbcb8388f7a4cb09bf05bcb6c44f46b11a956b25a1b6d50a2d27f2ee71e"],  "0x5380c7b7ae81a58eb98d9c78de4a1fd7fd9535fc953ed2be602daaa41767312a"

// "0x5380c7b7ae81a58eb98d9c78de4a1fd7fd9535fc953ed2be602daaa41767312a"