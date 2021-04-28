const { soliditySha256 } = require("../shared/crypto");
const { hexToBN, toBN } = require("../shared/conversion");
const { ZkMerkleTree } = require('../shared/merkle');
const BN = require('bn.js')

class TransactorMerkle extends ZkMerkleTree {

    constructor(userAmount){
        super(userAmount)
    }

    checkTrade(trade, latestPrices) { // this method is used by the transactor to ensure no invalid orders are added, which would cost the transactor gas. 
                        // These checks are the same ones checked in the zkSNARK programm
        //check signature here aswell
        trade = this.convertTradeToBN(trade)
        if (!this.verifyBalanceLeaf(trade)) return false // ensures that where passed are in merkletree
        if(!this.ensureCorrectPrice(trade, latestPrices)) return false;
        console.log("pricing and balance ok")
        if(trade.direction === 0) {
            if(trade.ethAmount.gte(trade.deltaEth)){
                return true;
            }
        } else if(trade.direction === 1){
            if(trade.tokenAmount.gte(trade.deltaToken)){
                return true;
            }
        }
        return false;
    }

    verifyBalanceLeaf(trade) {
        const tree = super.getTree("balance");
        const root = tree.getHexRoot();
        const leaf = soliditySha256([trade.address, trade.ethAmount, trade.tokenAmount, trade.nonce]);
        const index = super.checkForKnowUser(trade.address);
        const proof = tree.getHexProof(leaf, index);
        return tree.verify(proof, leaf, root)
    }

    convertTradeToBN(trade){
        trade['ethAmount'] = hexToBN(trade['ethAmount'])
        trade['tokenAmount'] = hexToBN(trade['tokenAmount'])
        trade['deltaEth'] = hexToBN(trade['deltaEth'])
        trade['deltaToken'] = hexToBN(trade['deltaToken'])
        return trade
    }
    convertPricesToBN(pri) {
        return {
            tokenToEth: toBN(pri['tokenToEth']),
            ethToToken: toBN(pri['ethToToken'])
        }
    }

    ensureCorrectPrice(trade, latestPrices) {
        let prices = this.convertPricesToBN(latestPrices)
        console.log(trade)
        console.log(prices.ethToToken.mul(trade.deltaEth).toString(10))
        console.log(toBN(10000000000).mul(trade.deltaToken).toString(10))
        
        console.log(toBN(1000000000000).mul(trade.deltaEth).toString(10))
        console.log(prices.tokenToEth.mul(trade.deltaToken).toString(10))
        console.log(latestPrices)
        if(trade.direction == 0) {
            if((prices.ethToToken.mul(trade.deltaEth).toString(10) === toBN(10000000000).mul(trade.deltaToken).toString(10))) return true;
        } else {
            if(toBN(1000000000000).mul(trade.deltaEth).toString(10) === prices.tokenToEth.mul(trade.deltaToken).toString(10)) return true;
        }
        return false;
    }

    getMerklePaths(indices, balanceUpdates) {
        const tree = super.getTree("Balance"); 
        const oldRoot = tree.getHexRoot() //first store current root
        this.balancesTemp = this.balances; // copy state to temp balances
        let newRoot = null;
        for(let i = 0; i < indices.length; i++) {
            const tree = this.getTempTree();
            newRoot = tree.getRoot().toString('hex')
            let leaf = soliditySha256([this.balancesTemp[indices[i]].address, this.balancesTemp[indices[i]].ethAmount, this.balancesTemp[indices[i]].tokenAmount, this.balancesTemp[indices[i]].nonce])
            // let proof = tree.getHexProof(leaf)
            let path = tree.getHexProof(leaf).map(elem => this.hexTo128bitInt(elem))
            
            balanceUpdates[i].merklePath = path;
            this.updateNewBalanceTemp(balanceUpdates[i].address, balanceUpdates[i].newEthAmount, balanceUpdates[i].newTokenAmount, balanceUpdates[i].newNonce)
            newRoot = tree.getRoot().toString('hex')
        }
        const tempTree = this.getTempTree();
        newRoot = tempTree.getRoot().toString('hex')
        return [balanceUpdates, this.hexTo128bitInt(oldRoot), "0x" + newRoot]
    }

    getMulti(indices) {
        const tree = super.getTree("Balance");
        const root = tree.getHexRoot();
        indices = indices.sort()
        const proofLeafs = indices.map(i => soliditySha256([this.balances[i].address, this.balances[i].ethAmount, this.balances[i].tokenAmount, this.balances[i].nonce]))
        console.log(proofLeafs)
        const proof = tree.getHexMultiProof(indices)
        console.log(proof)

        const proofFlags = tree.getProofFlags(indices, tree.getMultiProof(indices))
        const paddedProof = this.addPadding(proof, proofFlags.length).map(leaf => this.hexTo128bitInt(leaf))
        const verifiedLocal = tree.verifyMultiProof(root, indices, proofLeafs, tree.getDepth(), proof)
        console.log(root)
        console.log("Verified locally:", verifiedLocal)
        return [paddedProof, proofFlags, this.hexTo128bitInt(root)]
    }

    getMultiBenchmark(indices) {
        const tree = super.getTree("Balance");
        const proofFlags = tree.getProofFlags(indices, tree.getMultiProof(indices))
        return [proofFlags.length, tree.getMultiProof(indices).length]
    }

    getSingleProof(i) {
        const tree = super.getTree("Balance");
        let leaf = soliditySha256([this.balances[i].address, this.balances[i].ethAmount, this.balances[i].tokenAmount, this.balances[i].nonce])
        return tree.getHexProof(leaf)
    }

    calcNewRoot(balances, indexes) {
        for(let i = 0; i < balances.length; i++){
            this.updateNewBalance(balances[i].address, balances[i].ethAmount, balances[i].tokenAmount, balances[i].nonce)
        }
        
        let tree = this.getTree("balances");
        let root = tree.getRoot().toString('hex')

        console.log("Root of new balances: ", "0x" + root)
        return  "0x" + root
    }

    updateNewBalance(address, ethAmount, tokenAmount, nonce) {
        const index = this.checkForKnowUser(address)
        this.balances[index].ethAmount = ethAmount;
        this.balances[index].tokenAmount = tokenAmount;
        this.balances[index].nonce = nonce;
        this.balances[index].address = address;
    }

    updateNewBalanceTemp(address, ethAmount, tokenAmount, nonce) {
        const index = this.checkForKnowUser(address)
        this.balancesTemp[index].ethAmount = ethAmount;
        this.balancesTemp[index].tokenAmount = tokenAmount;
        this.balancesTemp[index].nonce = nonce;
        this.balancesTemp[index].address = address;
    }

    toEigthBytesArray(leaf){
        let newLeaf = new Array(8);
        if(leaf.substring(0,2) == "0x") leaf = leaf.split("0x")[1]
        for(let i = 0; i < leaf.length; i += 8){
            newLeaf[i/8] = "0x" + leaf.substring(i, i + 8)
        }
        return newLeaf
    }

    hexTo128bitInt(hex) {
        if(hex.substring(0,2) == "0x") hex = hex.split("0x")[1]
        const sub1 = new BN(hex.substring(0, 32), 16).toString(10)
        const sub2 = new BN(hex.substring(32, 64), 16).toString(10)
        return [sub1, sub2]
    }

    addPadding(proof, length){
        while(proof.length < length){
            proof.push('0x0000000000000000000000000000000000000000000000000000000000000000')
        }
        return proof;
    }


//     // WORKS:
// const leaves = ['0xcc08e5636A9ceb03917C1ac7BbEda23aD57766F3', '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000', '0x0000000000000000000000000000000000000000'].map(soliditySha256)
// const tree = new MerkleTree(leaves, soliditySha256, { sortPairs: true })

// const root = tree.getRoot()
// const indices = [1,2]
// const proofLeaves = indices.map(i => leaves[i])
// const proof = tree.getHexMultiProof(indices)
// const proofFlags = tree.getProofFlags(indices, tree.getMultiProof(indices))
// const verifiedLocal = tree.verifyMultiProof(root, indices, proofLeaves, tree.getDepth(), proof)
}


module.exports = TransactorMerkle