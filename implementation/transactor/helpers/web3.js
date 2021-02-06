const ZkSwap = require("../contracts/ZkSwap.json")
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

const verifyTradeOnchain = async (balanceTxObject, proofObject) => {
    const web3 = await getWeb3();
    let accounts = await web3.eth.getAccounts();
    let instance = await getContractInstance();
    console.log(proofObject)
    console.log(balanceTxObject)
    instance.methods.verifyTrade(
        balanceTxObject.ethAmount, 
        balanceTxObject.tokenAmount, 
        balanceTxObject.nonce, 
        balanceTxObject.address,
        proofObject.proof.a,
        proofObject.proof.b,
        proofObject.proof.c,
        proofObject.inputs
    ).send({
        from: accounts[0],
        gas: 6000000
    })
    .then(res => console.log(res))
    .catch(err => {
        console.error(err)
    })
}

exports.verifyTradeOnchain = verifyTradeOnchain;
exports.getRegisterEvents = getRegisterEvents;
exports.getDepositEvents = getDepositEvents;
exports.getContractInstance = getContractInstance;