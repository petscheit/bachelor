import store from '../redux/store';
const { MerkleTree } = require('merkletreejs')
const { getRegisterEvents, getDepositEvents } = require("./web3");
const { keccak } = require("./crypto");
const Web3Utils = require('web3-utils');

class ZkMerkleTree {

    constructor(){
        this.users = null;
        this.balances = null;
        this.index = 1;
        this.emptyAddress = "0x0000000000000000000000000000000000000000";
        this.userAmount = 4;
        this.initilizeDatastructure()
    }

    async init(){
        await this.syncRegisterEvents();
        await this.syncDepositEvents();
    }

    addAddress(address) {
        this.users[this.index] = address;
        this.index++;
    }

    addBalance(amount, index) {
        this.balances[index].amount = Number(amount);
        return true;
    }

    getBalance(address) {
        return this.balances[this.getAddressIndex(address)]
    }

    getAddressIndex(address){
        return this.users.indexOf(address);
    }

    isUserRegistered(address) {
        return this.getAddressIndex(address) != -1;
    }

    async syncDepositEvents(){
        let events = await getDepositEvents();
        for(let i = 0; i < events.length; i++){
            const index = this.getAddressIndex(events[i].returnValues._from)
            this.addBalance(events[i].returnValues.amount, index)
        }
        console.log("Deposits synced successfully!")
        // console.log(this.balances)
    }

    async syncRegisterEvents(){
        console.log("syncing...")
        let events = await getRegisterEvents();
        console.log(events)
        for(let i = 0; i < events.length; i++){
            this.addAddress(events[i].returnValues._from)
        }
        console.log("Registrations synced successfully!")
        // console.log(this.users)
    }

    getRegisterProof(){
        const leaf = keccak(this.emptyAddress);
        const tree = this.getTree("users");
        let proof = tree.getHexProof(leaf, this.index);
        this.printRegisterProof(proof, leaf)
        return [proof, leaf]
    }

    getDepositProof(address){
        let userIndex = this.getAddressIndex(address);
        let userProof = this.getUserProofPath(address);
        let balanceProof = this.getBalanceProofPath(this.balances[userIndex], userIndex)
        this.printDepositProof(userProof, balanceProof, this.balances[userIndex].amount, this.balances[userIndex].nonce, address)
        this.printWithdrawProof(userProof, balanceProof, this.balances[userIndex].amount, this.balances[userIndex].nonce, address)
        return [userProof, balanceProof, this.balances[userIndex].amount.toString(), this.balances[userIndex].nonce.toString()]
    }

    getUserProofPath(leaf){
        leaf = keccak(leaf);
        const tree = this.getTree("users");
        let proof = tree.getHexProof(leaf);
        return proof;
    }

    getBalanceProofPath(leaf, index){
        leaf = keccak(keccak(Web3Utils.encodePacked(leaf.amount, leaf.nonce)));
        const tree = this.getTree("balance");
        let proof = tree.getHexProof(leaf, index);
        return proof;
    }

    // HELPERS:
    getTree(type){
        if(type == "users"){
            const leaves = this.users.map(x => keccak(x))
            return new MerkleTree(leaves, keccak, { sortPairs: true })
        } else {
            const leaves = this.balances.map(x => keccak(Web3Utils.encodePacked(x.amount, x.nonce)))
            return new MerkleTree(leaves, keccak, { sortPairs: true })
        }
    }

    initilizeDatastructure(){
        // initilize empty users
        let users = new Array(this.userAmount);
        for(var i = 0; i < users.length; i++) users[i] = this.emptyAddress;
        users[0] = "0xcc08e5636A9ceb03917C1ac7BbEda23aD57766F3" // the first address needs to be set, in order for sibling checks to work on chain
        // initialize empty balances
        let balances = new Array(this.userAmount);
        for(var i = 0; i < balances.length; i++) balances[i] = { amount: 0, nonce: 0 };
        
        this.users = users;
        this.balances = balances
    }

    printRegisterProof(proof, leaf){ // returns format that can be pasted into remix
        console.log()
        console.log("Registration Proof:")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log('[\"' + proof.toString().replace(",", "\",\"") + "\"], \"0x" + leaf.toString('hex') + "\"")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    }

    printDepositProof(userProof, balanceProof, amount, nonce, address){
        console.log()
        console.log("Deposit Proof for " + address + ":")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log('[\"' + userProof.toString().replace(",", "\",\"") + "\"], " +  '[\"' + balanceProof.toString().replace(",", "\",\"") + "\"], " + amount + ", " + nonce)
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    }

    printWithdrawProof(userProof, balanceProof, amount, nonce, address){
        console.log()
        console.log("Deposit Proof for " + address + ":")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log('[\"' + userProof.toString().replace(",", "\",\"") + "\"], " +  '[\"' + balanceProof.toString().replace(",", "\",\"") + "\"], " + amount + ", " + nonce + ", " + amount)
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    }
}

// (async () => {
//     let instance = new ZkMerkleTree();
//     await instance.init()
//     instance.getRegisterProof()
//     instance.getDepositProof("0x31b878918679d9DA1DB277B1A2fD67Aa01032920")
// })()

export { ZkMerkleTree };