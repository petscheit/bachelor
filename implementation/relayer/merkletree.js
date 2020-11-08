const { MerkleTree } = require('merkletreejs')
const { getAccounts, getRegisterEvents } = require("./web3Helper");
const { keccak } = require("./helpers");
const { format } = require('crypto-js');


let users = initializeUsers(4);
let index = 0;
// let users = ['a', 'b', 'a', 'd'];
let balances = initializeBalances(256);

function addAddress(address) {
    if(index < 0) return false; //index has to be a natural number

    if(index == 0){
        if(users[0] !== "0x0000000000000000000000000000000000000000") return false; //entry is empty
        users[0] = address;
        index++;
    } else {
        if(users[index] !== "0x0000000000000000000000000000000000000000") return false //entry is empty
        if(users[index - 1] === "0x0000000000000000000000000000000000000000") return false //previous entry is not empty
        users[index] = address;
        index++;
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

function getLeafProof(leaf, array){
    leaf = keccak(leaf);
    const tree = getTree(array);
    let proof = tree.getHexProof(leaf, index);
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
    return '[\"' + getLeafProof("0x0000000000000000000000000000000000000000", users).toString().replace(",", "\",\"") + "\"], \"" + "0x5380c7b7ae81a58eb98d9c78de4a1fd7fd9535fc953ed2be602daaa41767312a\"";
}

async function syncEvents(){
    let events = await getRegisterEvents();
    console.log(events)
    for(let i = 0; i < events.length; i++){
        addAddress(events[i].returnValues._from)
    }
}

(async () => {
    calculateRoot(users)
    await syncEvents()
    calculateRoot(users)
    console.log(latestFreeProof())
})()