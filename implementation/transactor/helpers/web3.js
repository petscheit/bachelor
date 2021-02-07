const ZkSwap = require("../contracts/ZkSwap.json")
const getWeb3 = require("./getWeb3.js")
// import { ethToWei, weiToMwei, mweiToWei } from "../shared/conversion";

const getRegisterEvents = async function() {
    const instance = await getContractInstance();
    let events = await instance.getPastEvents("Registered", { fromBlock: "earliest" });
    return events;
}

const getBalanceEvents = async function() {
    const instance = await getContractInstance();
    let events = await instance.getPastEvents("BalanceUpdate", { fromBlock: "earliest" });
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

const verifyTradeOnchain = async (balanceTxObject, proofObject, combined) => {
    const web3 = await getWeb3();
    let accounts = await web3.eth.getAccounts();
    let instance = await getContractInstance();
    let ethValue = combined.direction == 1 ? combined.deltaEth : 0
    console.log(proofObject)
    console.log(balanceTxObject)
    console.log(combined)
    instance.methods.verifyTrade(
        balanceTxObject.ethAmount, 
        balanceTxObject.tokenAmount, 
        balanceTxObject.nonce, 
        balanceTxObject.address,
        combined.direction,
        combined.deltaEth,
        combined.deltaToken,
        proofObject.proof.a,
        proofObject.proof.b,
        proofObject.proof.c,
        proofObject.inputs
    ).send({
        from: accounts[0],
        gas: 6000000,
        value: ethValue * 1000000
    })
    .then(res => console.log(res))
    .catch(err => {
        console.error(err)
    })
}

exports.verifyTradeOnchain = verifyTradeOnchain;
exports.getRegisterEvents = getRegisterEvents;
exports.getBalanceEvents = getBalanceEvents;
exports.getContractInstance = getContractInstance;