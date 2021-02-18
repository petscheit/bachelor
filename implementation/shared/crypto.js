const keccak256 = require("keccak256");
const abi = require('ethereumjs-abi');
const BN = require('bn.js');

module.exports = {
    keccak: (hashValue) => {
        return keccak256(hashValue)
    },
    soliditySha256: (hashValue) => {
        if(typeof hashValue == "string") { //Probably not needed anymore
            return "0x" + abi.soliditySHA256(
                ["address"],
                [hashValue]
            ).toString('hex')
        } 
        else if(Array.isArray(hashValue)) { // balances
            const address = hashValue[0]
            const ether = hashValue[1];
            const token = hashValue[2];
            const nonce = new BN(hashValue[3].toString(), 10);
            return "0x" + abi.soliditySHA256(
                [ "address", "uint", "uint", "uint"],
                [ address, ether, token, nonce]
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