import store from '../redux/store';
import { ethToWei, weiToMwei, mweiToWei } from "../shared/conversion";
import config from "../shared/config"

export const getBalanceEvents = async function() {
    const instance = store.getState().contract.instance;
    let events = await instance.getPastEvents("BalanceUpdate", { fromBlock: "earliest" });
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
          if(caughtEvent === "BalanceUpdate"){
            if(event.returnValues["_from"] === store.getState().user.address){
              store.getState().contract.stateManager.updateBalance(event.returnValues.ethAmount, event.returnValues.tokenAmount, event.returnValues.nonce, event.returnValues["_from"])
            }
          }
          latestBlockNumber = event.blockNumber;
        }
    )
}

export const getLatestPrice = async function() {
  const instance = store.getState().contract.instance;
  return instance.methods.setTokenAmount().call()
    .then(res => {
      console.log("Calced price:", (res / 1000000000000000000).toFixed(6))
      return (res / 1000000000000000000).toFixed(6)
    })
}

export const deposit = function(amount, token) {
  if(token == 0){ //ether
    return depositEth(amount)
  } else if(token == 1){ //zks
    depositERC20(amount)
  }
}

const depositERC20 = async function(amount) {
  const address = store.getState().user.address;
  const instance = store.getState().contract.instance;
  const erc20Instance = store.getState().contract.erc;
  const registered = store.getState().user.registered;
  console.log("registered", registered)
  console.log(amount)
  let proof;
  if(registered){
    proof = store.getState().contract.stateManager.getDepositProof(address)
  } else {
    proof = store.getState().contract.stateManager.getFirstDepositProof(address)
  }
  await erc20Instance.methods.approve(config.addresses.zkSwap, mweiToWei(amount))
  .send({
    from: address,
  })
  if(registered) {
    return instance.methods.depositERC20(proof[0], proof[1], proof[2], proof[3], amount).send({
      from: address,
    })
  } else {
    console.log(amount)
    return instance.methods.firstDepositERC20(proof[0], amount).send({
      from: address,
    })
  }
}

const depositEth = async function(amount) {
  const address = store.getState().user.address;
  const instance = store.getState().contract.instance;
  const registered = store.getState().user.registered;
  if(registered){
    const proof = store.getState().contract.stateManager.getDepositProof(address)
    return instance.methods.depositEth(proof[0], proof[1], proof[2], proof[3]).send({
      from: address,
      value: mweiToWei(amount)
    })
    .catch(err => console.log)
  } else {
    const proof = store.getState().contract.stateManager.getFirstDepositProof(address)
    return instance.methods.firstDepositEth(proof[0]).send({
      from: address,
      value: mweiToWei(amount)
    })
    .catch(err => console.log)
  }
}


export const withdraw = async function(amount, token) {
  if(token == 0){ //ether
    return withdrawEth(amount, token)
  } else if(token == 1){ //bat
    return withdrawERC20(amount, token)
  }
}

const withdrawEth = function(amount) {
  const address = store.getState().user.address;
  const instance = store.getState().contract.instance;
  const proof = store.getState().contract.stateManager.getWithdrawProof(address, amount)
  console.log(proof)
  instance.methods.withdrawEth(proof[0], proof[1], proof[2], proof[3], proof[4]).send({
    from: address,
  })
  .then(res => {
      console.log(res)
  })
  .catch(err => console.log)
}

const withdrawERC20 = function(amount) {
  console.log(amount)
  const address = store.getState().user.address;
  const instance = store.getState().contract.instance;
  const proof = store.getState().contract.stateManager.getWithdrawProof(address, amount)
  instance.methods.withdrawERC20(proof[0], proof[1], proof[2], proof[3], proof[4]).send({
    from: address,
  })
  .then(res => {
      console.log(res)
  })
  .catch(err => console.log)
}