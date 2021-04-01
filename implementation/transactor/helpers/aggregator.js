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

    generateBalanceUpdates(trades) {
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
        console.log(this.buildBalances(trades))
        console.log({direction: uniswapTradeDirection, deltaEth: Math.abs(combinedDeltas.deltaEth), deltaToken: Math.abs(combinedDeltas.deltaToken)})

        return {balanceUpdates: this.buildBalances(trades), direction: uniswapTradeDirection, deltaEth: Math.abs(combinedDeltas.deltaEth), deltaToken: Math.abs(combinedDeltas.deltaToken)}
    }

    // start(trades, direction){
    //     const combinedDeltas = this.combineDeltas(trades);
    //     const sellForEth = combinedDeltas.deltaEth.isNeg() ? true : false;
    //     console.log("Sell For eth?", sellForEth)

    //     const uniswapTradeDirection = combinedDeltas.deltaEth.isNeg() ? 0 : 1

    //     if(sellForEth){
    //         console.log("Selling " + combinedDeltas.deltaEth + "M Eth")
    //         console.log("For " + combinedDeltas.deltaToken + " Tokens")
    //     } else {
    //         console.log("Selling " + combinedDeltas.deltaToken + " Tokens")
    //         console.log("For " + combinedDeltas.deltaEth + " Eth")
    //     }
    //     console.log(this.buildNewBalances(trades))
    //     console.log({direction: uniswapTradeDirection, deltaEth: Math.abs(combinedDeltas.deltaEth), deltaToken: Math.abs(combinedDeltas.deltaToken)})
    //     return [this.buildOldBalances(trades), this.buildNewBalances(trades), {direction: uniswapTradeDirection, deltaEth: Math.abs(combinedDeltas.deltaEth), deltaToken: Math.abs(combinedDeltas.deltaToken)}]
    // }


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

    // buildNewBalances(trades) {
    //     let newBal = [];
    //     for(let i = 0; i < trades.length; i++){
    //         if(trades[i].direction === 0){
    //             newBal.push({
    //                 ethAmount: trades[i].ethAmount.sub(trades[i].deltaEth), 
    //                 tokenAmount: trades[i].tokenAmount.add(trades[i].deltaToken), 
    //                 nonce: Number(trades[i].nonce) + 1, 
    //                 address: trades[i].address
    //             })
    //         } else if (trades[i].direction === 1){
    //             newBal.push({
    //                 ethAmount: trades[i].ethAmount.add(trades[i].deltaEth), 
    //                 tokenAmount: trades[i].tokenAmount.sub(trades[i].deltaToken), 
    //                 nonce: Number(trades[i].nonce) + 1, 
    //                 address: trades[i].address
    //             })
    //         }
    //     }
    //     return newBal;
    // }

    buildBalances(trades) {
        let balances = [];
        for(let i = 0; i < trades.length; i++){
            if(trades[i].direction === 0){
                balances.push({
                    oldEthAmount: trades[i].ethAmount, 
                    oldTokenAmount: trades[i].tokenAmount, 
                    oldNonce: Number(trades[i].nonce),
                    newEthAmount: trades[i].ethAmount.sub(trades[i].deltaEth), 
                    newTokenAmount: trades[i].tokenAmount.add(trades[i].deltaToken), 
                    newNonce: Number(trades[i].nonce) + 1,  
                    address: trades[i].address
                })
            } else if (trades[i].direction === 1){
                balances.push({
                    oldEthAmount: trades[i].ethAmount, 
                    oldTokenAmount: trades[i].tokenAmount, 
                    oldNonce: Number(trades[i].nonce),
                    newEthAmount: trades[i].ethAmount.add(trades[i].deltaEth), 
                    newTokenAmount: trades[i].tokenAmount.sub(trades[i].deltaToken), 
                    newNonce: Number(trades[i].nonce) + 1,  
                    address: trades[i].address
                })
            }
        }
        return balances;
    }

    buildBalanceTxObject(balanceUpdates) {
        let res = [];
        for(let i = 0; i < balanceUpdates.length; i++) {
            res.push({
                ethAmount: balanceUpdates[i].newEthAmount.toString(),
                tokenAmount: balanceUpdates[i].newTokenAmount.toString(),
                nonce: balanceUpdates[i].newNonce.toString(),
                from: balanceUpdates[i].address
            })
        }
        return res
    }

    
}

module.exports = Aggregator;