const Web3Utils = require('web3-utils');
const BN = require('bn.js');

const weiToEth = (num) => {
    return Web3Utils.fromWei(num.toString(), "ether")
}

const ethToWei = (num) => {
    return Web3Utils.toWei(num.toString(), "ether")
}

const toBN = (num) => {
    if(num instanceof String){
        return new BN(num, 10)
    }
    return new BN(num.toString(), 10)
}

const ethIntToWeiBN = (num) => {
     if(num instanceof String){
        return Web3Utils.toWei(new BN(num, 10), "ether")
    }
    console.log(typeof num.toString())
    console.log(num.toString())
    return Web3Utils.toWei(new BN(num.toString(), 10), "ether")
}

exports.weiToEth = weiToEth;
exports.ethToWei = ethToWei;
exports.toBN = toBN;
exports.ethIntToWeiBN= ethIntToWeiBN;