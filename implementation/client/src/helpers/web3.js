import store from '../redux/store';
import { ethToWeiString } from "./conversion";


export const getRegisterEvents = async function() {
    const instance = store.getState().contract.instance;
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
                store.getState().contract.stateManager.updateBalance(event.returnValues.ethAmount, event.returnValues.tokenAmount, event.returnValues["_from"])
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

export const deposit = function(amount, token) {
  if(token == 0){ //ether
    return depositEth(amount)
  } else if(token == 1){ //bat
    depositERC20(amount)
  }
}

const depositERC20 = async function(amount) {
  const address = store.getState().user.address;
  const instance = store.getState().contract.instance;
  const erc20Instance = store.getState().contract.erc;
  const proof = store.getState().contract.stateManager.getDepositProof(address)
  await erc20Instance.methods.approve("0x139EB3Ed38B393AaD7f26D24E641dA218961F567", ethToWeiString(amount))
  .send({
    from: address,
  })
  .then(res => console.log)
  return instance.methods.depositERC20(proof[0], proof[1], proof[2], proof[3], proof[4], ethToWeiString(amount)).send({
    from: address,
  })
  .then(
    res => console.log
  )
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


export const withdraw = async function(amount, token) {
  amount = ethToWeiString(amount);
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
  instance.methods.withdrawEth(proof[0], proof[1], proof[2], proof[3], proof[4], proof[5]).send({
    from: address,
  })
  .then(res => {
      console.log(res)
  })
  .catch(err => console.log)
}

const withdrawERC20 = function(amount) {
  const address = store.getState().user.address;
  const instance = store.getState().contract.instance;
  const proof = store.getState().contract.stateManager.getWithdrawProof(address, amount)
  instance.methods.withdrawERC20(proof[0], proof[1], proof[2], proof[3], proof[4], proof[5]).send({
    from: address,
  })
  .then(res => {
      console.log(res)
  })
  .catch(err => console.log)
}