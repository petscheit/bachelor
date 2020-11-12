import Web3 from "web3";
import store from '../redux/store';

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
    let events = await instance.getPastEvents("Registered", { fromBlock: "earliest" });
    return events;
}

export const getDepositEvents = async function() {
    const instance = store.getState().contract.instance;
    let events = await instance.getPastEvents("Deposit", { fromBlock: "earliest" });
    return events;
}

export const invokeListener = async function(instance) {
    console.log("listener running")
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
            console.log("hereee")
            console.log(event)
            // this seems to be the only way events are only triggered once. When using switch/case statement all events trigger for some reason
            if(caughtEvent === "Register"){
                console.log("Caught register")
            } else if(caughtEvent === "Deposit"){
                console.log("Caught deposit")
            }
            latestBlockNumber = event.blockNumber;
        }
    )
}

export const register = async function(proof) {
    const instance = store.getState().contract.instance;
    return instance.methods.register(proof[0], proof[1]).send({ 
        from: store.getState().user.address 
    })
    .then(res => {
        console.log(res)
    })
    .catch(err => console.log)


}