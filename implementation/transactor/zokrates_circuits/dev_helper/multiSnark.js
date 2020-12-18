const { soliditySha256, solidityPairHash } = require("../../client/src/shared/crypto");
// Equivalent to multiMerkle multi proof verifier
function snarkImplementation(leafs, proofs, proofFlag) {
    leafsLen = leafs.length;
    totalHashes = 2;
    hashes = [];
    indexes =[0, 0, 0] // 0: leafPos, 1: hashPos, 2: proofPos
    for(let i = 0; i < totalHashes; i++){
        let fields = [leafs[indexes[0]], hashes[indexes[1]], proofs[indexes[2]]];
        aPos = getPosition(proofFlag[i], indexes[0], leafsLen);
        a = fields[aPos];
        indexes[aPos] = indexes[aPos] + 1;

        fields = [leafs[indexes[0]], hashes[indexes[1]], proofs[indexes[2]]];
        bPos = getPosition(true, indexes[0], leafsLen);
        b = fields[bPos];
        indexes[bPos] = indexes[bPos] + 1;
        hashes[i] = hashPair(a,b);

    }
    return hashes[totalHashes-1];
}

function getPosition(proofFlag, leafPos, leafsLen) {
    if(proofFlag){
        if(leafPos < leafsLen){
            return 0;
        }
        return 1;
    }
    return 2;
}

function hashPair(a, b) {
    return a < b ? hash_node(a, b) : hash_node(b, a);
}

function hash_node(left, right){
    console.log("Left:", left)
    console.log("Right:", right)
    console.log(solidityPairHash(left, right))
    console.log()
    return solidityPairHash(left, right);
}


console.log(snarkImplementation(["0xde47c9b27eb8d300dbb5f2c353e632c393262cf06340c4fa7f1b40c4cbd36f90","0xde47c9b27eb8d300dbb5f2c353e632c393262cf06340c4fa7f1b40c4cbd36f90"],["0xde47c9b27eb8d300dbb5f2c353e632c393262cf06340c4fa7f1b40c4cbd36f90","0x41a5cdefd306be6d82a6d9dcfb552c584cd96f57d420a45df551d964a1a0e928"],[ false, false, true ]))