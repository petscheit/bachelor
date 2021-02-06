const { exec } = require("child_process");
const fs = require('fs');

class ZokratesHelper {

    constructor(){
        this.oldBalances = [];
        this.newBalances = [];
        this.proof = [];
        this.proofFlags = [];
        this.witnessCommand = ' | zokrates compute-witness --input ./zokrates_circuits/out --output ./zokrates_circuits/witness --light --abi --abi_spec ./zokrates_circuits/abi.json --stdin'
    }

    prepareTrade(oldBalances, newBalances, proof, proofFlags, root){
        this.oldBalances = oldBalances.map(balance => this.buildZokratesBalanceStruct(balance));
        this.newBalances = newBalances.map(balance => this.buildZokratesBalanceStruct(balance));
        this.proofFlags = proofFlags;
        this.proof = proof;
        this.root = root;
    }

    buildProofString(){
        return "echo " + `\"${JSON.stringify([this.oldBalances, this.newBalances, this.proof, this.proofFlags, this.root, "1000000000000", "20400000000000"]).replace(/"/g, `\\"`)}\"`;
    }

    async computeWitness(){
        console.log("computing witness...")
        console.log(this.buildProofString())
        return new Promise((res, err) => {
            let child = exec(this.buildProofString() + this.witnessCommand);
            child.stdout.pipe(process.stdout)
            child.on('exit', function() {
                console.log("Generation proof...")
                let proofChild = exec("zokrates generate-proof -i ./zokrates_circuits/out -j ./zokrates_circuits/proof.json -p ./zokrates_circuits/proving.key");
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

    buildZokratesBalanceStruct(trade) {
        return {
            ethAmount: trade.ethAmount.toString(10),
            tokenAmount: trade.tokenAmount.toString(10),
            nonce: trade.nonce.toString(),
            address: this.toEightBytesArray(trade.address)
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