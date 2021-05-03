const Web3Utils = require('web3-utils');
const BN = require('bn.js');

const weiToMwei = (num) => {
    if(num instanceof String){
        return Web3Utils.fromWei(num, "mwei")
    }
    return Web3Utils.fromWei(num.toString(), "mwei")
}

const mweiToWei = (num) => {
    if(num instanceof String){
        return Web3Utils.toWei(num, "mwei")
    }
    return Web3Utils.toWei(num.toString(), "mwei")
}


const mweiToEth = (num) => {
    if(num instanceof String){
        return Web3Utils.fromWei(Web3Utils.toWei(num, "mwei"), "ether")
    }
    return Web3Utils.fromWei(Web3Utils.toWei(num.toString(), "mwei"), "ether")
}

const ethToMwei = (num) => {
     if(num instanceof String){
        return Web3Utils.fromWei(Web3Utils.toWei(num, "ether"), "mwei")
    }
    return Web3Utils.fromWei(Web3Utils.toWei(num.toString(), "ether"), "mwei")
}

const weiToEth = (num) => {
    if(num instanceof String){
        return Web3Utils.fromWei(num, "ether")
    }
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

const hexToBN = (num) => {
    return new BN(num, 16)
}

const ethIntToWeiBN = (num) => {
     if(num instanceof String){
        return Web3Utils.toWei(new BN(num, 10), "ether")
    }
    return Web3Utils.toWei(new BN(num.toString(), 10), "ether")
}

exports.weiToEth = weiToEth;
exports.ethToWei = ethToWei;
exports.toBN = toBN;
exports.ethIntToWeiBN= ethIntToWeiBN;
exports.hexToBN = hexToBN;

exports.weiToMwei = weiToMwei;
exports.mweiToWei = mweiToWei;

exports.mweiToEth = mweiToEth;
exports.ethToMwei = ethToMwei;