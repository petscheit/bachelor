const { soliditySha256 } = require("../shared/crypto");
const BN = require('bn.js');
const { ZkMerkleTree } = require('../shared/merkle')
console.log(ZkMerkleTree)
class ClientTree extends ZkMerkleTree {

    constructor(){
        super();
        console.log(this.balances)
    }

    isUserRegistered(address) {
        return super.getAddressIndex(address) != -1;
    }

    getRegisterProof(){
        const leaf = soliditySha256(this.emptyAddress);
        const tree = super.getTree("users");
        let proof = tree.getHexProof(leaf, this.index);
        super.printRegisterProof(proof, leaf)
        return [proof, leaf]
    }

    getDepositProof(address){
        let userIndex = super.getAddressIndex(address);
        let userProof = this.getUserProofPath(address);
        let balanceProof = this.getBalanceProofPath(this.balances[userIndex], userIndex)
        super.printDepositProof(userProof, balanceProof, this.balances[userIndex].ethAmount.toString(), this.balances[userIndex].tokenAmount.toString(), this.balances[userIndex].nonce, address)
        return [userProof, balanceProof, this.balances[userIndex].ethAmount.toString(), this.balances[userIndex].tokenAmount.toString(), this.balances[userIndex].nonce.toString()]
    }

    getWithdrawProof(address, withdrawAmount) {
        let userIndex = super.getAddressIndex(address);
        let userProof = this.getUserProofPath(address);
        let balanceProof = this.getBalanceProofPath(this.balances[userIndex], userIndex)
        super.printWithdrawProof(userProof, balanceProof, this.balances[userIndex].ethAmount.toString(), this.balances[userIndex].tokenAmount.toString(), this.balances[userIndex].nonce, withdrawAmount, address)
        return [userProof, balanceProof, this.balances[userIndex].ethAmount.toString(), this.balances[userIndex].tokenAmount.toString(), this.balances[userIndex].nonce.toString(), withdrawAmount.toString()]
    }

    getUserProofPath(leaf){
        leaf = soliditySha256(leaf);
        const tree = super.getTree("users");
        let proof = tree.getHexProof(leaf);
        return proof;
    }

    getBalanceProofPath(leaf, index){
        leaf = soliditySha256([leaf.ethAmount, leaf.tokenAmount, leaf.nonce]);
        const tree = super.getTree("balance");
        let proof = tree.getHexProof(leaf, index);
        return proof;
    }
}

export { ClientTree };