const Web3Utils = require('web3-utils');
const BN = require('bn.js');

const weiToEth = (num) => {
    return Web3Utils.fromWei(num.toString(), "ether")
}

const ethToWeiString = (num) => {
    return Web3Utils.toWei(num.toString(), "ether")
}

const stringToIntBigNum = (num) => {
    return new BN(num, 10)
}

exports.weiToEth = weiToEth;
exports.ethToWeiString = ethToWeiString;
exports.stringToIntBigNum = stringToIntBigNum;