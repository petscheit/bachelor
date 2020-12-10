const ZkSwap = require("./contracts/ZkSwap.json")
const getWeb3 = require("./getWeb3.js")

const getRegisterEvents = async function() {
    const instance = await getContractInstance();
    let events = await instance.getPastEvents("Registered", { fromBlock: "earliest" });
    return events;
}

const getDepositEvents = async function() {
    const instance = await getContractInstance();
    let events = await instance.getPastEvents("Deposit", { fromBlock: "earliest" });
    return events;
}

const getContractInstance = async () => {
    const web3 = await getWeb3();
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = ZkSwap.networks[networkId];
    return new web3.eth.Contract(
        ZkSwap.abi,
        deployedNetwork.address,
    );
}

exports.getRegisterEvents = getRegisterEvents;
exports.getDepositEvents = getDepositEvents
exports.getContractInstance = getContractInstance