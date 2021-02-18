const { MerkleTree } = require('merkletreejs')
const { getRegisterEvents, getBalanceEvents } = require("../helpers/web3");
const { soliditySha256 } = require("./crypto");
const { toBN, weiToMwei } = require("./conversion")
const BN = require('bn.js');

class ZkMerkleTree {

    constructor(){
        this.balances = null;
        this.addressMapping = {}
        this.index = 0; // used for holding the next free index
        this.emptyAddress = "0x0000000000000000000000000000000000000000";
        this.userAmount = 256;
        this.initilizeDatastructure();
    }

    async init(){
        await this.syncBalanceEvents();
    }

    addBalance(address, ethAmount, tokenAmount, nonce, index) {
        this.balances[index].ethAmount = toBN(ethAmount);
        this.balances[index].tokenAmount = toBN(tokenAmount);
        this.balances[index].nonce = nonce;
        this.balances[index].address = address
    }

    getBalance(address) {
        return this.balances[this.addressMapping[address]]
    }

    getAddressIndex(address) {
        if(address in this.addressMapping) return this.addressMapping[address];
        return this.index;
    }

    updateBalance(address, ethAmount, tokenAmount, nonce) {
        const index = this.getAddressIndex(address);    
        this.addBalance(address, ethAmount, tokenAmount, nonce, index);
        return this.getBalance(address);
    }

    async syncBalanceEvents(){
        let events = await getBalanceEvents();
        for(let i = 0; i < events.length; i++){
            const index = this.checkForKnowUser(events[i].returnValues._from)
            this.addBalance(events[i].returnValues._from, events[i].returnValues.ethAmount, events[i].returnValues.tokenAmount, events[i].returnValues.nonce, index)
        }
        console.log("Balances synced successfully!")
    }

    checkForKnowUser(address) {
        if(address in this.addressMapping){
            return this.addressMapping[address]
        }
        this.addressMapping[address] = this.index;
        this.index += 1;
        return this.index - 1
    }

    // HELPERS:
    getTree(){
        const leaves = this.balances.map(leaf => soliditySha256([leaf.address, leaf.ethAmount, leaf.tokenAmount, leaf.nonce]))
        return new MerkleTree(leaves, soliditySha256, { sortPairs: true })
    }

    // this function is only used for recalculating the new merkle roots that are stored in the contract when changing the merkle tree
    calcInitialRoots(){
        const tree = this.getTree();
        const root = tree.getRoot().toString('hex')

        console.log("Root Balances: ", "0x" + root)
    }

    initilizeDatastructure(){
        // initialize empty balances
        let balances = new Array(this.userAmount);
        for(var i = 0; i < balances.length; i++) balances[i] = {address: this.emptyAddress, ethAmount: new BN(0, 10), tokenAmount: new BN(0, 10), nonce: 0 };
        this.balances = balances
    }


    printDepositProof(balanceProof, ethAmount, token, nonce, address){
        console.log()
        console.log("Deposit Proof for " + address + ":")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log('[\"' + balanceProof.toString().replace(",", "\",\"") + "\"], " + ethAmount + ", " + token + ", " + nonce)
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    }

    printWithdrawProof(balanceProof, ethAmount, token, nonce, withdrawAmount, address){
        console.log()
        console.log("Withdraw Proof for " + address + ":")
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log('[\"' + balanceProof.toString().replace(",", "\",\"") + "\"], " + ethAmount + ", " + token + ", " + nonce + ", " + withdrawAmount)
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
    }
}

exports.ZkMerkleTree = ZkMerkleTree