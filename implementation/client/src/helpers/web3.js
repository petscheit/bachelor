import Web3 from "web3";
import store from '../redux/store';
import { addBalance, addRegistrationStatus } from "../redux/actions";
import { ethToWeiString } from "./conversion";
import ERC20 from "../contracts/ERC20.json";

export const getWeb3 = () =>
  new Promise((resolve, reject) => {
    // Wait for loading completion to avoid race conditions with web3 injection timing.
    window.addEventListener("load", async () => {
      // Modern dapp browsers...
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          // Request account access if needed
          await window.ethereum.enable();
          // Acccounts now exposed
          resolve(web3);
        } catch (error) {
          reject(error);
        }
      }
      // Legacy dapp browsers...
      else if (window.web3) {
        // Use Mist/MetaMask's provider.
        const web3 = window.web3;
        console.log("Injected web3 detected.");
        resolve(web3);
      }
      // Fallback to localhost; use dev console port by default...
      else {
        const provider = new Web3.providers.HttpProvider(
          "http://127.0.0.1:8545"
        );
        const web3 = new Web3(provider);
        console.log("No web3 instance injected, using Local web3.");
        resolve(web3);
      }
    });
});

export const getRegisterEvents = async function() {
    const instance = store.getState().contract.instance;
    console.log(instance)
    // console.log(instance.currentProvider())
    let events = await instance.getPastEvents("Registered", { fromBlock: "earliest" });
    return events;
}

export const getDepositEvents = async function() {
    const instance = store.getState().contract.instance;
    let events = await instance.getPastEvents("Deposit", { fromBlock: "earliest" });
    return events;
}

export const invokeListener = async function() {
    const instance = store.getState().contract.instance;
    let latestBlockNumber;
    instance.events.allEvents(
        {
            fromBlock: latestBlockNumber
        },
        async (error, event) => {
            if (error) {
                console.error(error.msg);
                throw error;
            }
            const caughtEvent = event.event;
            if(caughtEvent === "Registered"){
              if(event.returnValues["_from"] === store.getState().user.address){
                  store.getState().contract.stateManager.updateRegistrationStatus(event.returnValues["_from"])
              }
            } else if(caughtEvent === "Deposit"){
              if(event.returnValues["_from"] === store.getState().user.address){
                store.getState().contract.stateManager.updateBalance(Number(event.returnValues.etherAmount), Number(event.returnValues.tokenAmount), event.returnValues["_from"])
              }
            }
            latestBlockNumber = event.blockNumber;
        }
    )
}

export const register = async function() {
  const instance = store.getState().contract.instance;
  const proof = store.getState().contract.stateManager.getRegisterProof()
  return instance.methods.register(proof[0], proof[1]).send({ 
      from: store.getState().user.address
  })
  .then(res => {
      // console.log(res)
  })
  .catch(err => console.log)


}

export const deposit = async function(amount, token) {
  if(token == 0){ //ether
    return depositEth(amount, token)
  } else if(token == 1){ //bat
    return depositERC20(amount, token)
  }
}

const depositERC20 = async function(amount, token) {

}

const depositEth = async function(amount) {
  const address = store.getState().user.address;
  const instance = store.getState().contract.instance;
  const proof = store.getState().contract.stateManager.getDepositProof(address)
  return instance.methods.depositEth(proof[0], proof[1], proof[2], proof[3], proof[4]).send({
    from: address,
    value: ethToWeiString(amount)
  })
  .catch(err => console.log)
}

const getERC20Instance = async function() {
  let web3 = await getWeb3();
  const address = store.getState().user.address;
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = ERC20.networks[networkId];
  console.log(deployedNetwork)
  const instance = new web3.eth.Contract(
    ERC20.abi,
    deployedNetwork.address,
  );
}

export const withdraw = async function(amount, token) {
  amount = ethToWeiString(amount);
  if(token == 0){ //ether
    return withdrawEth(amount, token)
  } else if(token == 1){ //bat
    // return withdrawERC20(amount, token)
  }
  

}

const withdrawEth = function(amount) {
  const address = store.getState().user.address;
  const instance = store.getState().contract.instance;
  const proof = store.getState().contract.stateManager.getWithdrawProof(address, amount)
  instance.methods.withdrawEth(proof[0], proof[1], proof[2], proof[3], proof[4], proof[5]).send({
    from: address,
  })
  .then(res => {
      console.log(res)
  })
  .catch(err => console.log)
}