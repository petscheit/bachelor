const SHA256 = require('crypto-js/sha256')
const { soliditySha256, solidityPairHash } = require("../../../client/src/shared/crypto");
const { MerkleTree } = require('merkletreejs')

function calcMerkle(leafs, proofs, proofFlag){
    const leafsLen = leafs.length;
    const totalHashes = proofFlag.length;
    let hashes = [];
    let leafPos = 0;
    let hashPos = 0;
    let proofPos = 0;
    for(let i =0; i < totalHashes; i++){
        let a = proofFlag[i] ? (leafPos < leafsLen ? leafs[leafPos++] : hashes[hashPos++]) : proofs[proofPos++]
        let b = leafPos < leafsLen ? leafs[leafPos++] : hashes[hashPos++]
        hashes[i] = hashPair(a, b)
    }

    console.log("Hashes:", hashes)
}


function hashPair(a, b){
    return a < b ? solidityPairHash(a, b) : solidityPairHash(b, a);
}


// WORKS:
const leaves = ['0xcc08e5636A9ceb03917C1ac7BbEda23aD57766F3', '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'].map(soliditySha256)
const tree = new MerkleTree(leaves, soliditySha256, { sortPairs: true })

const root = tree.getRoot()
console.log("Root:", root)
const indices = [1,2]
console.log(tree.getHexLayers())
console.log(indices)
const proofLeaves = indices.map(i => leaves[i])
console.log("Leafs:", proofLeaves)
const proof = tree.getHexMultiProof(indices)
console.log("proof:", proof)
const proofFlags = tree.getProofFlags(indices, tree.getMultiProof(indices))
console.log(proofFlags)
// const verified = await contract.verifyMultiProof.call(root, proofLeaves, proof, proofFlags)
const verifiedLocal = tree.verifyMultiProof(root, indices, proofLeaves, tree.getDepth(), proof)
console.log("Locally:", verifiedLocal)

calcMerkle(proofLeaves, proof, proofFlags)


// ["0xde47c9b27eb8d300dbb5f2c353e632c393262cf06340c4fa7f1b40c4cbd36f90","0xde47c9b27eb8d300dbb5f2c353e632c393262cf06340c4fa7f1b40c4cbd36f90"],["0xde47c9b27eb8d300dbb5f2c353e632c393262cf06340c4fa7f1b40c4cbd36f90","0x41a5cdefd306be6d82a6d9dcfb552c584cd96f57d420a45df551d964a1a0e928"],[ false, false, true ]
