const { exec } = require("child_process");

class ZokratesHelper {

    constructor(){
        this.trades = [];
        this.proof = [];
        this.proofFlags = [];
        this.witnessCommand = ' | zokrates compute-witness --input ./zokrates_circuits/out --output ./zokrates_circuits/witnes --light --abi --abi_spec ./zokrates_circuits/abi.json --stdin'
    }

    prepareTrade(trades, proof, proofFlags){
        this.trades = trades.map(trade => this.buildZokratesTradeStruct(trade));
        this.proofFlags = proofFlags;
        this.proof = proof;
        console.log(proof)
    }

    buildProofString(){
        return "echo " + `\"${JSON.stringify([this.trades, this.proof, this.proofFlags]).replace(/"/g, `\\"`)}\"`;
    }

    computeWitness(){
        exec(this.buildProofString() + this.witnessCommand, (err, stdout, stderr) => {
            if (err) {
                console.error(`exec error: ${err}`);
                return;
            }

            console.log(stdout);
            return "Success!"
        })
    }

    buildZokratesTradeStruct(trade) {
        return {
            ethAmount: trade.ethAmount.toString(10),
            tokenAmount: trade.tokenAmount.toString(10),
            deltaEth: trade.deltaEth.toString(10),
            deltaToken: trade.deltaToken.toString(10),
            nonce: trade.nonce.toString(),
            direction: trade.direction.toString()
        }
    }
}

module.exports = ZokratesHelper