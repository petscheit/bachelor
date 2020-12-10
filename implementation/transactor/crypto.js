const keccak256 = require("keccak256");
const abi = require('ethereumjs-abi');
const BN = require('bn.js');

module.exports = {
    keccak: (hashValue) => {
        return keccak256(hashValue)
    },
    soliditySha256: (hashValue) => {
        if(typeof hashValue == "string") { //this is a unhashed address
            return "0x" + abi.soliditySHA256(
                ["address"],
                [hashValue]
            ).toString('hex')
        } 
        else if(Array.isArray(hashValue)) { // balances
            const ether = new BN(hashValue[0].toString(), 10);
            const token = new BN(hashValue[1].toString(), 10);
            const nonce = new BN(hashValue[2].toString(), 10);
            const zero = new BN("0", 10) // we currently need this for ZoKrates compatibility
            return abi.soliditySHA256(
                [ "uint", "uint", "uint", "uint"],
                [ ether, token, nonce, zero ]
            ).toString('hex')
        }
        else { // merkle tree merge hashes 
            const part1 = "0x" + Buffer.from(hashValue.slice(0, 32), 'utf8').toString('hex');
            const part2 = "0x" + Buffer.from(hashValue.slice(32, 64), 'utf8').toString('hex');
            return  abi.soliditySHA256(
                [ "bytes32", "bytes32"],
                [ part1, part2 ]
            ).toString('hex')
        }
    },
    solidityPairHash: (a, b) => {
        return "0x" + abi.soliditySHA256(
                [ "bytes32", "bytes32"],
                [ a, b ]
            ).toString('hex')
    }
}