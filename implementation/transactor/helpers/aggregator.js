const BN = require('bn.js');
const { mweiToEth } = require("../shared/conversion");
class Aggregator {

    start(trades, price){
        const combinedDeltas = this.combineDeltas(trades);
        const sellForEth = combinedDeltas.deltaEth.isNeg() ? true : false;
        console.log("Sell For eth?", sellForEth)

        const uniswapTradeDirection = combinedDeltas.deltaEth.isNeg() ? 0 : 1

        if(sellForEth){
            console.log("Selling " + mweiToEth(combinedDeltas.deltaEth) + " Eth")
            console.log("For " + mweiToEth(combinedDeltas.deltaToken) + " Tokens")
        } else {
            console.log("Selling " + mweiToEth(combinedDeltas.deltaToken) + " Tokens")
            console.log("For " + mweiToEth(combinedDeltas.deltaEth) + " Eth")
        }
        console.log(this.buildNewBalances(trades))
        return [this.buildOldBalances(trades), this.buildNewBalances(trades)]
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