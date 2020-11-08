const { MerkleTree } = require('merkletreejs')
const { getAccounts, getRegisterEvents, getDepositEvents } = require("./web3Helper");
const { keccak } = require("./helpers");
const Web3Utils = require('web3-utils');

let users = initializeUsers(4);
let index = 1;
let balances = initializeBalances(4);

function addAddress(address) {
    users[index] = address;
    index++;
    return true
}

function getAddressIndex(address){
    return users.indexOf(address);
}

function calculateUserRoot(){
    const tree = getUserTree();
    const root = tree.getRoot().toString('hex')
    console.log("Root: ", root)
    return root
}

function calculateBalancesRoot(){
    const tree = getBalanceTree();
    const root = tree.getRoot().toString('hex')
    console.log("Root: ", root)
    return root
}

function getEmptyLeafProof(leaf){
    console.log(leaf)
    leaf = keccak(leaf);
    const tree = getUserTree();
    let proof = tree.getHexProof(leaf, index);
    return proof;
}


function getUserTree(){
    const leaves = users.map(x => keccak(x))
    return new MerkleTree(leaves, keccak, { sortPairs: true })
}

function getUserLeafProof(leaf){
    leaf = keccak(leaf);
    const tree = getUserTree();
    let proof = tree.getHexProof(leaf);
    return proof;
}

function getBalanceTree(){
    const leaves = balances.map(x => keccak(Web3Utils.encodePacked(x.amount, x.nonce)))
    return new MerkleTree(leaves, keccak, { sortPairs: true })
}

function getBalanceLeafProof(leaf, index){
    leaf = keccak(keccak(Web3Utils.encodePacked(leaf.amount, leaf.nonce)));
    const tree = getBalanceTree();
    let proof = tree.getHexProof(leaf, index);
    return proof;
}

function initializeUsers(length){
    let users = new Array(length)
    for(var i = 0; i < users.length; i++) users[i] = "0x0000000000000000000000000000000000000000";
    users[0] = "0xcc08e5636A9ceb03917C1ac7BbEda23aD57766F3" // the first address needs to be set, in order for sibling checks to work on chain
    return users;
}

function initializeBalances(length){
    let balances = new Array(length)
    for(var i = 0; i < balances.length; i++) balances[i] = { amount: 0, nonce: 0 };
    return balances;
}

function latestFreeUserProof(){
    return '[\"' + getEmptyLeafProof("0x0000000000000000000000000000000000000000").toString().replace(",", "\",\"") + "\"], \"" + "0x5380c7b7ae81a58eb98d9c78de4a1fd7fd9535fc953ed2be602daaa41767312a\"";
}

async function syncEvents(){
    let events = await getRegisterEvents();
    console.log(events)
    for(let i = 0; i < events.length; i++){
        addAddress(events[i].returnValues._from)
    }
}

async function getNextRegisterProof(){
    await syncEvents()
    console.log(latestFreeUserProof())
}

async function getDepositProof(address){
    let userIndex = getAddressIndex(address);
    console.log(userIndex)
    let userProof = getUserLeafProof(address);
    let balanceProof = getBalanceLeafProof(balances[userIndex], userIndex)
    console.log(printProof(userProof) + ", " + printProof(balanceProof) + ", " + balances[userIndex].amount + ", " + balances[userIndex].nonce)
}

function printProof(proof){
    return'[\"' + proof.toString().replace(",", "\",\"") + "\"]"
}

(async () => {
    calculateUserRoot()
    await getNextRegisterProof()
    getDepositProof("0x31b878918679d9DA1DB277B1A2fD67Aa01032920")
    console.log(await getDepositEvents())
})()


