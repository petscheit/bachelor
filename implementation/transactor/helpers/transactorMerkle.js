const { soliditySha256 } = require("../shared/crypto");
const { stringToIntBigNum } = require("../shared/conversion");
const { ZkMerkleTree } = require('../shared/merkle');

class TransactorMerkle extends ZkMerkleTree {

    constructor(){
        super()
    }

    checkTrade(trade) { // this method is used by the transactor to ensure no invalid orders are added, which would cost the transactor gas. 
                        // These checks are the same ones checked in the zkSNARK programm
        //check signature here aswell
        trade = this.convertTradeToBN(trade)

        if (!this.verifyBalanceLeaf(trade)) return false // ensures that where passed are in merkletree

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
        const leaf = soliditySha256([trade.ethAmount, trade.tokenAmount, trade.nonce]);
        const index = super.getAddressIndex(trade.address);
        const proof = tree.getHexProof(leaf, index);
        return tree.verify(proof, leaf, root)
    }

    convertTradeToBN(trade){
        trade['ethAmount'] = stringToIntBigNum(trade['ethAmount'])
        trade['tokenAmount'] = stringToIntBigNum(trade['tokenAmount'])
        trade['deltaEth'] = stringToIntBigNum(trade['deltaEth'])
        trade['deltaToken'] = stringToIntBigNum(trade['deltaToken'])
        return trade
    }
}

module.exports = TransactorMerkle