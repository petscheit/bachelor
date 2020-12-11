const Web3 = require("web3")

const getWeb3 = async () => {
    return new Promise((resolve, reject) => {
        // Wait for loading completion to avoid race conditions with web3 injection timing.
        if(typeof window !== "undefined"){
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
                    resolve(web3);
                }
            });
        } else { //fallback when running in node
            const provider = new Web3.providers.WebsocketProvider('ws://localhost:8545')
            const web3 = new Web3(provider);
            resolve(web3);
        }
    })
};

module.exports = getWeb3