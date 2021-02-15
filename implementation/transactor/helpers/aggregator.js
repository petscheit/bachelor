const BN = require('bn.js');
const { mweiToEth } = require("../shared/conversion");
class Aggregator {

    generateMinimalTrade(trades) {
        const combinedDeltas = this.combineDeltas(trades);
        const direction = combinedDeltas.deltaEth.isNeg() ? 0 : 1

        if(direction === 0){
            return {direction: 0, input: combinedDeltas.deltaEth.abs().toString(), output: combinedDeltas.deltaToken.toString()}
        } else {
            return {direction: 1, input: combinedDeltas.deltaToken.abs().toString(), output: combinedDeltas.deltaEth.toString()}
        }
    }

    start(trades, direction){
        const combinedDeltas = this.combineDeltas(trades);
        const sellForEth = combinedDeltas.deltaEth.isNeg() ? true : false;
        console.log("Sell For eth?", sellForEth)

        const uniswapTradeDirection = combinedDeltas.deltaEth.isNeg() ? 0 : 1

        if(sellForEth){
            console.log("Selling " + combinedDeltas.deltaEth + "M Eth")
            console.log("For " + combinedDeltas.deltaToken + " Tokens")
        } else {
            console.log("Selling " + combinedDeltas.deltaToken + " Tokens")
            console.log("For " + combinedDeltas.deltaEth + " Eth")
        }
        console.log(this.buildNewBalances(trades))
        console.log({direction: uniswapTradeDirection, deltaEth: Math.abs(combinedDeltas.deltaEth), deltaToken: Math.abs(combinedDeltas.deltaToken)})
        return [this.buildOldBalances(trades), this.buildNewBalances(trades), {direction: uniswapTradeDirection, deltaEth: Math.abs(combinedDeltas.deltaEth), deltaToken: Math.abs(combinedDeltas.deltaToken)}]
    }


    // returns 
    combineDeltas(trades){
        let deltaEth = new BN("0", 10);
        let deltaToken = new BN("0", 10);
        for(let i = 0; i < trades.length; i++){
            if(trades[i].direction === 0){
                deltaEth.isub(trades[i].deltaEth)
                deltaToken.iadd(trades[i].deltaToken)
            } else {
                deltaEth.iadd(trades[i].deltaEth)
                deltaToken.isub(trades[i].deltaToken)
            }
        }
        return {deltaEth, deltaToken}
    }

    buildNewBalances(trades) {
        let newBal = [];
        for(let i = 0; i < trades.length; i++){
            if(trades[i].direction === 0){
                newBal.push({
                    ethAmount: trades[i].ethAmount.sub(trades[i].deltaEth), 
                    tokenAmount: trades[i].tokenAmount.add(trades[i].deltaToken), 
                    nonce: Number(trades[i].nonce) + 1, 
                    address: trades[i].address
                })
            } else if (trades[i].direction === 1){
                newBal.push({
                    ethAmount: trades[i].ethAmount.add(trades[i].deltaEth), 
                    tokenAmount: trades[i].tokenAmount.sub(trades[i].deltaToken), 
                    nonce: Number(trades[i].nonce) + 1, 
                    address: trades[i].address
                })
            }
        }
        return newBal;
    }

    buildOldBalances(trades) {
        console.log(trades[0].tokenAmount.toString())
        let newBal = [];
        for(let i = 0; i < trades.length; i++){
            if(trades[i].direction === 0){
                newBal.push({
                    ethAmount: trades[i].ethAmount, 
                    tokenAmount: trades[i].tokenAmount, 
                    nonce: trades[i].nonce, 
                    address: trades[i].address
                })
            } else if (trades[i].direction === 1){
                newBal.push({
                    ethAmount: trades[i].ethAmount, 
                    tokenAmount: trades[i].tokenAmount, 
                    nonce: trades[i].nonce, 
                    address: trades[i].address
                })
            }
        }
        return newBal;
    }

    buildBalanceTxObject(newBalances) {
        let ethAmount = [];
        let tokenAmount = [];
        let nonce = [];
        let address = [];
        for(let i = 0; i < newBalances.length; i++) {
            ethAmount.push(newBalances[i].ethAmount)
            tokenAmount.push(newBalances[i].tokenAmount)
            nonce.push(newBalances[i].nonce)
            address.push(newBalances[i].address)
        }
        return {ethAmount, tokenAmount, nonce, address}
    }

    
}

module.exports = Aggregator;