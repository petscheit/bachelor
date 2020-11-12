const Web3Utils = require('web3-utils');

export const weiToEth = (num) => {
    return Web3Utils.fromWei(num, "ether")
}

export const ethToWeiString = (num) => {
    return Web3Utils.toWei(num.toString(), "ether")
}