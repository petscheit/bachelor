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
        this.userAmount = 32768;
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

    async syncDepositEvents(){
        let events = await getDepositEvents();
        for(let i = 0; i < events.length; i++){
            const index = this.getAddressIndex(events[i].returnValues._from)
            this.addBalance(events[i].returnValues.etherAmount, events[i].returnValues.tokenAmount, index)
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

    checkTrade(trade) { // this method is used by the transactor to ensure no invalid orders are added, which would cost the transactor gas. 
                        // These checks are the same ones checked in the zkSNARK programm
        //check signature here aswell
        if(trade.direction === 0) {
            if(trade.ethAmount >= trade.deltaEth && trade.tokenAmount <= trade.deltaToken){
                return true;
            }
        } else if(trade.direction === 1){
            if(trade.ethAmount <= trade.deltaEth && trade.tokenAmount >= trade.deltaToken){
                return true;
            }
        }
        return false;
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

    getAddressIndex(address){
        return this.users.indexOf(address);
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

module.exports = ZkMerkleTree