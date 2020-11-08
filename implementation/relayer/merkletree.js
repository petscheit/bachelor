const { MerkleTree } = require('merkletreejs')

const { keccak } = require("./helpers");


let users = initializeUsers(4);
let index = 0;
// let users = ['a', 'b', 'a', 'd'];
let balances = initializeBalances(256);

function addAddress(index, address) {
    if(index < 0) return false; //index has to be a natural number

    if(index == 0){
        if(users[0] !== "0x0000000000000000000000000000000000000000") return false; //entry is empty
        users[0] = address;
    } else {
        if(users[index] !== "0x0000000000000000000000000000000000000000") return false //entry is empty
        if(users[index - 1] === "0x0000000000000000000000000000000000000000") return false //previous entry is not empty
        users[index] = address;
    }
    return true
}

function calculateRoot(array){
    console.log(array)
    const tree = getTree(array);
    const root = tree.getRoot().toString('hex')
    console.log("Root: ", root)
    return root
}

function getLeafProof(leaf, leafIndex, array){
    leaf = keccak(leaf);
    const tree = getTree(array);
    let proof = tree.getHexProof(leaf, leafIndex);
    return proof;
}

function getTree(array){
    const leaves = array.map(x => keccak(x))
    return new MerkleTree(leaves, keccak, { sortPairs: true })
}

function initializeUsers(length){
    let users = new Array(length)
    for(var i = 0; i < users.length; i++) users[i] = "0x0000000000000000000000000000000000000000";
    return users;
}

function initializeBalances(length){
    let balances = new Array(length)
    for(var i = 0; i < balances.length; i++) balances[i] = { balance: 0, nonce: 0 };
    return balances;
}

function latestFreeProof(){
    
}
