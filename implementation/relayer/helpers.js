const SHA3 = require("crypto-js/sha3")
const Web3Utils = require('web3-utils');
const keccak256 = require("keccak256");
module.exports = {
    keccak: (hashValue) => {
        return keccak256(hashValue)
    }
}