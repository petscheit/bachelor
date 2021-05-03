const { soliditySha256 } = require("../shared/crypto");
const { ZkMerkleTree } = require('../shared/merkle')
const { mweiToWei } = require('../shared/conversion')

class ClientMerkle extends ZkMerkleTree {

    constructor(){
        super(256);
    }

    getDepositProof(address){
        let userIndex = super.checkForKnowUser(address);
        let balanceProof = this.getBalanceProofPath(this.balances[userIndex], userIndex)
        super.printDepositProof(balanceProof, this.balances[userIndex].ethAmount.toString(), this.balances[userIndex].tokenAmount.toString(), this.balances[userIndex].nonce, address)
        return [balanceProof, this.balances[userIndex].ethAmount.toString(), this.balances[userIndex].tokenAmount.toString(), this.balances[userIndex].nonce.toString()]
    }

    getFirstDepositProof(address){
        let userIndex = super.checkForKnowUser(address);
        let balanceProof = this.getBalanceProofPath(this.balances[userIndex], userIndex)
        super.printDepositProof(balanceProof, this.balances[userIndex].ethAmount.toString(), this.balances[userIndex].tokenAmount.toString(), this.balances[userIndex].nonce, address)
        return [balanceProof]
    }

    getWithdrawProof(address, withdrawAmount) {
        let userIndex = super.checkForKnowUser(address);
        let balanceProof = this.getBalanceProofPath(this.balances[userIndex], userIndex)
        super.printWithdrawProof(balanceProof, mweiToWei(this.balances[userIndex].ethAmount.toString()), mweiToWei(this.balances[userIndex].tokenAmount.toString()), this.balances[userIndex].nonce, mweiToWei(withdrawAmount), address)
        return [balanceProof, this.balances[userIndex].ethAmount.toString(), this.balances[userIndex].tokenAmount.toString(), this.balances[userIndex].nonce.toString(), withdrawAmount.toString()]
    }

    getBalanceProofPath(leaf, index){
        leaf = soliditySha256([leaf.address, leaf.ethAmount, leaf.tokenAmount, leaf.nonce]);
        const tree = super.getTree("balance");
        let proof = tree.getHexProof(leaf, index);
        return proof;
    }
}


export { ClientMerkle };