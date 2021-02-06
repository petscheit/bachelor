const { MerkleTree } = require('merkletreejs')
const { getRegisterEvents, getBalanceEvents } = require("../helpers/web3");
const { soliditySha256 } = require("./crypto");
const { toBN, weiToMwei } = require("./conversion")
const BN = require('bn.js');

class ZkMerkleTree {

    constructor(){
        this.users = null;
        this.balances = null;
        this.index = 1;
        this.emptyAddress = "0x0000000000000000000000000000000000000000";
        this.userAmount = 256;
        this.initilizeDatastructure()
    }

    async init(){
        await this.syncRegisterEvents();
        await this.syncBalanceEvents();
    }

    addAddress(address) {
        this.users[this.index] = address;
        this.index++;
    }

    addBalance(ethAmount, tokenAmount, nonce, index) {
        this.balances[index].ethAmount = toBN(ethAmount);
        this.balances[index].tokenAmount = toBN(tokenAmount);
        this.balances[index].nonce = nonce;
    }

    getBalance(address) {
        return this.balances[this.getAddressIndex(address)]
    }

    getAddressIndex(address){
        return this.users.indexOf(address);
    }

    updateBalance(ethAmount, tokenAmount, nonce, address) {
        const index = this.getAddressIndex(address);    
        this.addBalance(ethAmount, tokenAmount, nonce, index);
        return this.getBalance(address);
    }

    async syncBalanceEvents(){
        let events = await getBalanceEvents();
        for(let i = 0; i < events.length; i++){
            const index = this.getAddressIndex(events[i].returnValues._from)
            this.addBalance(events[i].returnValues.ethAmount, events[i].returnValues.tokenAmount, events[i].returnValues.nonce, index)
        }
        console.log("Deposits synced successfully!")
    }

    async syncRegisterEvents(){
        let events = await getRegisterEvents();
        for(let i = 0; i < events.length; i++){
            this.addAddress(events[i].returnValues._from)
        }
        console.log("Registrations synced successfully!")
    }

    // HELPERS:
    getTree(type){
        if(type == "users"){
            const leaves = this.users.map(x => soliditySha256(x))
            return new MerkleTree(leaves, soliditySha256, { sortPairs: true })
        } else {
            const leaves = this.balances.map(leaf => soliditySha256([leaf.ethAmount, leaf.tokenAmount, leaf.nonce]))
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
        for(var i = 0; i < balances.length; i++) balances[i] = { ethAmount: new BN(0, 10), tokenAmount: new BN(0, 10), nonce: 0 };
        
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

    printDepositProof(userProof, balanceProof, ethAmount, token, nonce, address){
        console.log()
        console.log("Deposit Proof for " + address + ":")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log('[\"' + userProof.toString().replace(",", "\",\"") + "\"], " +  '[\"' + balanceProof.toString().replace(",", "\",\"") + "\"], " + ethAmount + ", " + token + ", " + nonce)
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    }

    printWithdrawProof(userProof, balanceProof, ethAmount, token, nonce, withdrawAmount, address){
        console.log()
        console.log("Withdraw Proof for " + address + ":")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log('[\"' + userProof.toString().replace(",", "\",\"") + "\"], " +  '[\"' + balanceProof.toString().replace(",", "\",\"") + "\"], " + ethAmount + ", " + token + ", " + nonce + ", " + withdrawAmount)
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    }
}

exports.ZkMerkleTree = ZkMerkleTree