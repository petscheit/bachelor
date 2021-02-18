pragma solidity >=0.5.0 <0.7.0;

/**
 * @author Ricardo Guilherme Schmidt (Status Research & Development GmbH)
 * @notice based on https://github.com/ethereum/eth2.0-specs/blob/dev/ssz/merkle-proofs.md#merkle-multiproofs but without generalized indexes
 */
contract MerkleMultiProof {

    function calculateMultiMerkleRoot(
        bytes32[] memory leafs,
        bytes32[] memory proofs,
        bool[] memory proofFlag
    )
        public
        pure
        returns (bytes32 merkleRoot)
    {
        uint256 leafsLen = leafs.length;
        uint256 totalHashes = proofFlag.length;
        bytes32[] memory hashes = new bytes32[](totalHashes);
        uint leafPos = 0;
        uint hashPos = 0;
        uint proofPos = 0;
        for(uint256 i = 0; i < totalHashes; i++){
            hashes[i] = hashPair(
                proofFlag[i] ? (leafPos < leafsLen ? leafs[leafPos++] : hashes[hashPos++]) : proofs[proofPos++],
                leafPos < leafsLen ? leafs[leafPos++] : hashes[hashPos++]
            );
        }

        return hashes[totalHashes-1];
    }
    event Hash(bytes32 hash);
    
    function snarkImplementation(
        bytes32[] memory leafs,
        bytes32[] memory proofs,
        bool[] memory proofFlag
    )
        public
        returns (bytes32)
    {
        uint256 leafsLen = leafs.length;
        uint256 totalHashes = 3;
        bytes32[] memory hashes = new bytes32[](totalHashes);
        uint256[3] memory indexes;
        indexes[0] = 0;
        indexes[1] = 0;
        indexes[2] = 0;
        for(uint256 i = 0; i < totalHashes; i++){
            bytes32[3] memory fields = [leafs[indexes[0]], hashes[indexes[1]], proofs[indexes[2]]];
            uint aPos = getPosition(proofFlag[i], indexes[0], leafsLen);
            bytes32 a = fields[aPos];
            indexes[aPos] = indexes[aPos] + 1;
            
            fields = [leafs[indexes[0]], hashes[indexes[1]], proofs[indexes[2]]];
            uint bPos = getPosition(true, indexes[0], leafsLen);
            bytes32 b = fields[bPos];
            indexes[bPos] = indexes[bPos] + 1;
            hashes[i] = hashPair(a,b);
            emit Hash(hashes[i]);
        }

        return hashes[totalHashes-1];
       
    }
    
    function getPosition(bool proofFlag, uint leafPos, uint leafsLen)
        public
        returns (uint)
    {
        if(proofFlag){
            if(leafPos < leafsLen){
                return 0;
            }
            return 1;
        }
        return 2;
    }

    function hashPair(bytes32 a, bytes32 b) public pure returns(bytes32){
        return a < b ? hash_node(a, b) : hash_node(b, a);
    }

    function hash_node(bytes32 left, bytes32 right)
        private pure
        returns (bytes32 hash)
    {
       
        return sha256(abi.encode(left, right));
    }

    /**
     * @notice Check validity of multimerkle proof
     * @param root merkle root
     * @param leafs out of order sequence of leafs and it's siblings
     * @param proofs out of order sequence of parent proofs
     * @param proofFlag flags for using or not proofs while hashing against hashes.
     */
    function verifyMultiProof(
        bytes32 root,
        bytes32[] memory leafs,
        bytes32[] memory proofs,
        bool[] memory proofFlag
    )
        public
        pure
        returns (bool)
    {
        return calculateMultiMerkleRoot(leafs, proofs, proofFlag) == root;
    }

}
