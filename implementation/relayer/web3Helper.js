const Web3 = require("web3");
const web3Utils = require("web3-utils");
// const truffleConfig = require("../truffle-config");
const ZkSwap = require("../contracts/build/contracts/ZkSwap.json")
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

async function getWeb3Instance(){
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = ZkSwap.networks[networkId];
    return new web3.eth.Contract(
        ZkSwap.abi,
        deployedNetwork.address,
    );
}

module.exports.getAccounts = async function(){
    return await web3.eth.getAccounts();
}

module.exports.getRegisterEvents = async function(){
    let instance = await getWeb3Instance();
    let events = await instance.getPastEvents("Registered", { fromBlock: "earliest" });
    return events;
}

module.exports.getDepositEvents = async function(){
    let instance = await getWeb3Instance();
    let events = await instance.getPastEvents("Deposit", { fromBlock: "earliest" });
    return events;
}