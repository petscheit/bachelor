const { exec } = require("child_process");
const fs = require('fs');

class ZokratesHelper {

    constructor(){
        this.balanceUpdates = null;
        this.root = null;
        this.witnessCommand = ' | zokrates compute-witness --input ./zokrates_circuits/out --output ./zokrates_circuits/witness --light --abi --abi_spec ./zokrates_circuits/abi.json --stdin'
    }

    prepareTrade(balanceUpdates, root){
        this.balanceUpdates = balanceUpdates.map(balanceUpdate => this.buildZokratesBalanceStruct(balanceUpdate));
        this.root = root;
    }
    
    buildProofString(ethToToken, tokenToEth){
        return "echo " + `\"${JSON.stringify([this.balanceUpdates, this.root, ethToToken, tokenToEth]).replace(/"/g, `\\"`)}\"`;
    }

    async computeWitness(ethToToken, tokenToEth){
        console.log(this.buildProofString(ethToToken, tokenToEth) + this.witnessCommand)
        return new Promise((res, err) => {
            let child = exec(this.buildProofString(ethToToken, tokenToEth) + this.witnessCommand);
            child.stdout.pipe(process.stdout)
            child.on('exit', function() {
                console.log("Generation proof...")
                let proofChild = exec("zokrates generate-proof -i ./zokrates_circuits/out -j ./zokrates_circuits/proof.json -p ./zokrates_circuits/proving.key -w ./zokrates_circuits/witness");
                proofChild.stdout.pipe(process.stdout)
                proofChild.on('exit', function() {
                    // process.exit()
                    console.log("proof generated...")
                    const proofData = JSON.parse(fs.readFileSync('./zokrates_circuits/proof.json'));
                    res(proofData)
                })
            })
        })
    }

    buildZokratesBalanceStruct(balanceUpdate) {
        return {
            oldEthAmount: balanceUpdate.oldEthAmount.toString(10),
            oldTokenAmount: balanceUpdate.oldTokenAmount.toString(10),
            oldNonce: balanceUpdate.oldNonce.toString(),
            newEthAmount: balanceUpdate.newEthAmount.toString(10),
            newTokenAmount: balanceUpdate.newTokenAmount.toString(10),
            newNonce: balanceUpdate.newNonce.toString(),
            address: this.toEightBytesArray(balanceUpdate.address),
            merklePath: balanceUpdate.merklePath
        }
    }

    toEightBytesArray(leaf){
        let newLeaf = new Array();
        if(leaf.substring(0,2) == "0x") leaf = leaf.split("0x")[1]
        for(let i = 0; i < leaf.length; i += 8){
            newLeaf[i/8] = "0x" + leaf.substring(i, i + 8)
        }
        return newLeaf
    }
}

module.exports = ZokratesHelper