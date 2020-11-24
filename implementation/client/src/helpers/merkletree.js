import store from '../redux/store';
const { MerkleTree } = require('merkletreejs')
const { getRegisterEvents, getDepositEvents } = require("./web3");
const { soliditySha256 } = require("./crypto");
const { stringToIntBigNum } = require("./conversion")

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

    addBalance(ether, token, index) {
        this.balances[index].ether = stringToIntBigNum(ether);
        this.balances[index].token = stringToIntBigNum(token);
    }

    getBalance(address) {
        return this.balances[this.getAddressIndex(address)]
    }

    updateBalance(ether, token, address) {
        const index = this.getAddressIndex(address);    
        this.addBalance(ether, token, index);
        return this.getBalance(address);
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
            this.addBalance(events[i].returnValues.etherAmount, events[i].returnValues.tokenAmount, index)
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
        const leaf = soliditySha256(this.emptyAddress);
        const tree = this.getTree("users");
        let proof = tree.getHexProof(leaf, this.index);
        this.printRegisterProof(proof, leaf)
        return [proof, leaf]
    }

    getDepositProof(address){
        console.log(address)
        let userIndex = this.getAddressIndex(address);
        let userProof = this.getUserProofPath(address);
        let balanceProof = this.getBalanceProofPath(this.balances[userIndex], userIndex)
        this.printDepositProof(userProof, balanceProof, this.balances[userIndex].ether, this.balances[userIndex].token, this.balances[userIndex].nonce, address)
        return [userProof, balanceProof, this.balances[userIndex].ether.toString(), this.balances[userIndex].token.toString(), this.balances[userIndex].nonce.toString()]
    }

    getWithdrawProof(address, withdrawAmount) {
        let userIndex = this.getAddressIndex(address);
        let userProof = this.getUserProofPath(address);
        let balanceProof = this.getBalanceProofPath(this.balances[userIndex], userIndex)
        this.printWithdrawProof(userProof, balanceProof, this.balances[userIndex].ether, this.balances[userIndex].token, this.balances[userIndex].nonce, withdrawAmount, address)
        return [userProof, balanceProof, this.balances[userIndex].ether.toString(), this.balances[userIndex].token.toString(), this.balances[userIndex].nonce.toString(), withdrawAmount.toString()]
    }

    getUserProofPath(leaf){
        leaf = soliditySha256(leaf);
        const tree = this.getTree("users");
        let proof = tree.getHexProof(leaf);
        return proof;
    }

    getBalanceProofPath(leaf, index){
        leaf = soliditySha256([leaf.ether, leaf.token, leaf.nonce]);
        const tree = this.getTree("balance");
        let proof = tree.getHexProof(leaf, index);
        console.log(proof)
        return proof;
    }

    // HELPERS:
    getTree(type){
        if(type == "users"){
            const leaves = this.users.map(x => soliditySha256(x))
            return new MerkleTree(leaves, soliditySha256, { sortPairs: true })
        } else {
            const leaves = this.balances.map(leaf => soliditySha256([leaf.ether, leaf.token, leaf.nonce]))
            return new MerkleTree(leaves, soliditySha256, { sortPairs: true })
        }
    }

    // this function is only used for recalculating the new merkle roots that are stored in the contract when changing the merkle tree
    calcInitialRoots(){
        let tree = this.getTree("users");
        let root = tree.getRoot().toString('hex')

        console.log("Root Users: ", "0x" + root)

        tree = this.getTree("balances");
        root = tree.getRoot().toString('hex')

        console.log("Root Balances: ", "0x" + root)
    }

    initilizeDatastructure(){
        // initilize empty users
        let users = new Array(this.userAmount);
        for(var i = 0; i < users.length; i++) users[i] = this.emptyAddress;
        users[0] = "0xcc08e5636A9ceb03917C1ac7BbEda23aD57766F3" // the first address needs to be set, in order for sibling checks to work on chain
        // initialize empty balances
        let balances = new Array(this.userAmount);
        for(var i = 0; i < balances.length; i++) balances[i] = { ether: 0, token: 0, nonce: 0 };
        
        this.users = users;
        this.balances = balances
    }

    printRegisterProof(proof, leaf){ // returns format that can be pasted into remix
        console.log()
        console.log("Registration Proof:")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log('[\"' + proof.toString().replace(",", "\",\"") + "\"], \"" + leaf.toString('hex') + "\"")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    }

    printDepositProof(userProof, balanceProof, ether, token, nonce, address){
        console.log()
        console.log("Deposit Proof for " + address + ":")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log('[\"' + userProof.toString().replace(",", "\",\"") + "\"], " +  '[\"' + balanceProof.toString().replace(",", "\",\"") + "\"], " + ether + ", " + token + ", " + nonce)
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    }

    printWithdrawProof(userProof, balanceProof, ether, token, nonce, withdrawAmount, address){
        console.log()
        console.log("Withdraw Proof for " + address + ":")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log('[\"' + userProof.toString().replace(",", "\",\"") + "\"], " +  '[\"' + balanceProof.toString().replace(",", "\",\"") + "\"], " + ether + ", " + token + ", " + nonce + ", " + withdrawAmount)
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