const keccak256 = require("keccak256");
module.exports = {
    keccak: (hashValue) => {
        return keccak256(hashValue)
    }
}