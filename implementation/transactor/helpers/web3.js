const ZkSwap = require("../contracts/ZkSwap.json")
const PairProxy = require("../contracts/PairProxy.json")
const IERC20 = require("../contracts/IERC20.json")
const getWeb3 = require("./getWeb3.js")
const Tx = require('ethereumjs-tx').Transaction
const Web3Utils = require('web3-utils');
const addresses = require("../config").addresses;

const mweiToWei = require("../shared/conversion.js").mweiToWei

const privateKeySender = "04fb4507e72398b4e7461e717d999cbc7d91bb5da10ac0cf38b00446c2be696d"
const addressSender = "0xcc08e5636A9ceb03917C1ac7BbEda23aD57766F3"

const chain = 'ropsten'

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
    const web3 = await getWeb3(chain);
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = ZkSwap.networks[networkId];
    return new web3.eth.Contract(
        ZkSwap.abi,
        deployedNetwork.address,
    );
}

const getProxyInstance = async (address) => {
    const web3 = await getWeb3(chain);
    return new web3.eth.Contract(
        PairProxy.abi,
        address
    );
}

const getERC20Instance = async (address) => {
    const web3 = await getWeb3(chain);
    return new web3.eth.Contract(
        IERC20.abi,
        address
    );
}

const verifyTradeOnchain = async (balanceTxObject, proofObject, combined) => {
    const web3 = await getWeb3(chain);
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
        value: mweiToWei(ethValue)
    })
    .then(res => console.log(res))
    .catch(err => {
        console.error(err)
    })
}

const invokeListener = async () => {
    instance = await getProxyInstance(addresses.proxy);
    let latestBlockNumber;
    instance.events.TradeComplete(
      {
          fromBlock: latestBlockNumber
      },
      async (error, event) => {
        if (error) {
            console.error(error.msg);
            throw error;
        }
        if(event.blockNumber !== blockNumber){
            const caughtEvent = event.event;
            console.log(event)
            latestBlockNumber = event.blockNumber;
        }
      }
    )
  }

const ethForTokens = async (amountEth, minAmountOut) => {
    invokeListener()
    const web3 = await getWeb3(chain);
    let instance = await getProxyInstance(addresses.proxy);
    const data = instance.methods.ethForToken(minAmountOut, amountEth).encodeABI();
    const txData = buildTxData(addressSender, addresses.proxy, mweiToWei(amountEth), data)

    await sendRawTransaction(txData, web3)
    console.log("Swap complete")
}

const tokenForEth = async (amountToken, minAmountOut) => {
    await tokenApprove(amountToken);
    // 
    const web3 = await getWeb3(chain);
    let instance = await getProxyInstance(addresses.proxy);
    const data = instance.methods.tokenForEth(minAmountOut, amountToken).encodeABI(); 
    const txData = buildTxData(addressSender, addresses.proxy, 0, data)
    await sendRawTransaction(txData, web3)
    console.log("Swap complete")
}

const buildTxData = (from, to, amountEth, data) => {
    return {
        gasLimit: Web3Utils.toHex(800000),
        gasPrice: Web3Utils.toHex(3e9), // 10 Gwei
        to: to,
        from: from,
        value: Web3Utils.toHex(amountEth.toString()),
        data: data 
    }
}

const sendRawTransaction = async (txData, web3) => {
    await web3.eth.getTransactionCount(addressSender).then(txCount => {
        console.log(txData)
        const newNonce = web3.utils.toHex(txCount)
        const transaction = new Tx({ ...txData, nonce: newNonce }, { chain: chain }) // or 'rinkeby'
        transaction.sign(Buffer.from(privateKeySender, 'hex'))
        const serializedTx = transaction.serialize().toString('hex')
        return web3.eth.sendSignedTransaction('0x' + serializedTx)
    })
    console.log("Transaction successful!")
}

exports.verifyTradeOnchain = verifyTradeOnchain;
exports.getRegisterEvents = getRegisterEvents;
exports.getBalanceEvents = getBalanceEvents;
exports.getContractInstance = getContractInstance;