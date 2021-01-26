const { soliditySha256 } = require("../shared/crypto");
const { hexToBN } = require("../shared/conversion");
const { ZkMerkleTree } = require('../shared/merkle');

class TransactorMerkle extends ZkMerkleTree {

    constructor(){
        super()
    }

    checkTrade(trade, currentPrice) { // this method is used by the transactor to ensure no invalid orders are added, which would cost the transactor gas. 
                        // These checks are the same ones checked in the zkSNARK programm
        //check signature here aswell
        trade = this.convertTradeToBN(trade)
        if (!this.verifyBalanceLeaf(trade)) return false // ensures that where passed are in merkletree
        if(!this.ensureCorrectPrice(trade, 20.4)) return false;
        if(trade.direction === 0) {
            console.log("masde ittt")
            console.log(trade.ethAmount.gte(trade.deltaEth))
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
        const leaf = soliditySha256([trade.ethAmount, trade.tokenAmount, trade.nonce]);
        const index = super.getAddressIndex(trade.address);
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

    ensureCorrectPrice(trade, correctPrice) {
        console.log(Math.round((trade.deltaToken / trade.deltaEth)*10000)/10000)
        if(Math.round((trade.deltaToken / trade.deltaEth)*10000)/10000 === correctPrice) return true;
        return false;
    }

    getMulti(indices) {
        const tree = super.getTree("Balance");
        const root = tree.getHexRoot();
        const proofLeafs = indices.map(i => soliditySha256([this.balances[i].ethAmount, this.balances[i].tokenAmount, this.balances[i].nonce]))
        const proof = tree.getHexMultiProof(indices)

        const proofFlags = tree.getProofFlags(indices, tree.getMultiProof(indices))
        const paddedProof = this.addPadding(proof, proofFlags.length).map(leaf => this.toEigthBytesArray(leaf))
        const verifiedLocal = tree.verifyMultiProof(root, indices, proofLeafs, tree.getDepth(), proof)
        console.log(root)
        console.log("Verified locally:", verifiedLocal)
        return [paddedProof, proofFlags, this.toEigthBytesArray(root)]
    }

    calcNewRoot(balances, indexes) {
        console.log(balances)
        for(let i = 0; i < indexes.lenght; i++){
            
        }
    }

    toEigthBytesArray(leaf){
        let newLeaf = new Array(8);
        if(leaf.substring(0,2) == "0x") leaf = leaf.split("0x")[1]
        for(let i = 0; i < leaf.length; i += 8){
            newLeaf[i/8] = "0x" + leaf.substring(i, i + 8)
        }
        return newLeaf
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