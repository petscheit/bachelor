const { initialize } = require('zokrates-js/node');
const fs = require('fs');
const { ethers } = require("ethers");
var abi = require('ethereumjs-abi')
var BN = require('bn.js')

const sha256 = (data) => hash.sha256().update(data).digest('hex')

// const { MerkleTree } = require('merkletreejs')

// const leaves = ['a', 'b', 'c'].map(x => SHA256(x))
// const tree = new MerkleTree(leaves, SHA256)
// const root = tree.getRoot().toString('hex')
// console.log(root)
// console.log(abi.solidityPack   ().toString('hex'))
// console.log(sha256(Buffer.from("ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb")))
// const leaf = sha256("ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb")
// console.log(hash.sha256().update('ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb').digest('hex')) //use web3 util insteaddd
// const proof = tree.getProof(leaf)
// console.log(tree.getHexProof(leaf))
// console.log(leaf.toString())
// console.log(tree.verify(proof, leaf, root)) // true



initialize().then((zokratesProvider) => {
    const source = fs.readFileSync("proof.zok", 'utf8')


    // compilation
    const artifacts = zokratesProvider.compile(source);
    // const input = [
    //     ["0xca978112", "0xca1bbdca", "0xfac231b3", "0x9a23dc4d", "0xa786eff8", "0x147c4e72", "0xb9807785", "0xafee48bb"],
    //     ["0xca978112", "0xca1bbdca", "0xfac231b3", "0x9a23dc4d", "0xa786eff8", "0x147c4e72", "0xb9807785", "0xafee48bb"]
    // ]
    
    const input = []
    // [[["0x41a5cdef", "0xd306be6d", "0x82a6d9dc", "0xfb552c58", "0x4cd96f57", "0xd420a45d", "0xf551d964", "0xa1a0e928"],["0x4d755387", "0x7a80ec8d", "0x79a23171", "0x3605b91f", "0x4207522d", "0x7c452062", "0xce173eb9", "0xf61a02c8"]]
    // ,["0xde47c9b2", "0x7eb8d300", "0xdbb5f2c3", "0x53e632c3", "0x93262cf0", "0x6340c4fa", "0x7f1b40c4", "0xcbd36f90"]]
// "[[\"0x41a5cdef\",\"0xd306be6d\",\"0x82a6d9dc\",\"0xfb552c58\",\"0x4cd96f57\",\"0xd420a45d\",\"0xf551d964\",\"0xa1a0e928\"],[\"0x4d755387\",\"0x7a80ec8d\",\"0x79a23171\",\"0x3605b91f\",\"0x4207522d\",\"0x7c452062\",\"0xce173eb9\",\"0xf61a02c8\"]],[\"0xde47c9b2\",\"0x7eb8d300\",\"0xdbb5f2c3\",\"0x53e632c3\",\"0x93262cf0\",\"0x6340c4fa\",\"0x7f1b40c4\",\"0xcbd36f90\"]"
    // computation
    const { witness, output } = zokratesProvider.computeWitness(artifacts, input);

    // run setup
    // const keypair = zokratesProvider.setup(artifacts.program);

    // generate proof
    // const proof = zokratesProvider.generateProof(artifacts.program, witness, keypair.pk);

    // export solidity verifier
    // const verifier = zokratesProvider.exportSolidityVerifier(keypair.vk, "v1");
    console.log(output)
});

// [
//     [
//         [
//             0x22a179e0, 0x372066dd, 0xa9b1b53a, 0xb55c7271, 0xd097acb9, 0x12ddc701, 0x7c12ed7d, 0x1232160c
//         ], 
//         [
//             0x22a179e0, 0x372066dd, 0xa9b1b53a, 0xb55c7271, 0xd097acb9, 0x12ddc701, 0x7c12ed7d, 0x1232160c
//         ]
//     ], 
//     [0x22a179e0, 0x372066dd, 0xa9b1b53a, 0xb55c7271, 0xd097acb9, 0x12ddc701, 0x7c12ed7d, 0x1232160c]
// ]

// [
//     [
//         ["0x3e23e816", "0x0039594a", "0x33894f65", "0x64e1b134", "0x8bbd7a00", "0x88d42c4a", "0xcb73eeae", "0xd59c009d"],
//         ["0x2e7d2c03", "0xa9507ae2", "0x65ecf5b5", "0x356885a5", "0x3393a202", "0x9d241394", "0x997265a1", "0xa25aefc6"]
//     ],
//     ["0xca978112", "0xca1bbdca", "0xfac231b3", "0x9a23dc4d", "0xa786eff8", "0x147c4e72", "0xb9807785", "0xafee48bb"]
// ]