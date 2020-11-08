const Web3 = require("web3");
const web3Utils = require("web3-utils");
// const truffleConfig = require("../truffle-config");
const ZkSwap = require("../contracts/build/contracts/ZkSwap.json")
let web3 = new Web3('ws://localhost:8545');


(async () => {
    const accounts = await web3.eth.getAccounts();
    console.log(accounts)
    const networkId = await web3.eth.net.getId();
    console.log(networkId)
    const deployedNetwork = ZkSwap.networks[networkId];
    const instance = new web3.eth.Contract(
        ZkSwap.abi,
        deployedNetwork.address,
    );
    console.log(await instance.getPastEvents("Registered"))
})()
