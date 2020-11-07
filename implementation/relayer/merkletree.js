const { MerkleTree } = require('merkletreejs')
const SHA256 = require('crypto-js/sha256')



let users = initializeUsers(256);
let balances = initializeBalances(256);
const balanced = new Array(256);

function addAddress(index, address) {
    if(index < 0) return false; //index has to be a natural number

    if(index == 0){
        if(users[0] !== "0x0") return false; //entry is empty

        users[0] = address;
    } else {
        if(users[index] !== "0x0") return false //entry is empty
        if(users[index - 1] === "0x0") return false //previous entry is not empty
        users[index] = address;
    }
    return calculateRoot(users)
}

function calculateRoot(array){
    const leaves = array.map(x => SHA256(x))
    const tree = new MerkleTree(leaves, SHA256)
    const root = tree.getRoot().toString('hex')
    // const leaf = SHA256('hahaha')
    // const proof = tree.getProof(leaf)
    // console.log("Proof: ", proof)
    // console.log(tree.verify(proof, leaf, root))

    return root
}

function initializeUsers(length){
    let users = new Array(length)
    for(var i = 0; i < users.length; i++) users[i] = "0x0";
    return users;
}

function initializeBalances(length){
    let balances = new Array(length)
    for(var i = 0; i < balances.length; i++) balances[i] = { balance: 0, nonce: 0 };
    return balances;
}

console.log(addAddress(0, "hahaha"))
console.log(addAddress(1, "Paull"))
console.log(addAddress(2, "dis so cool"))
console.log(users)