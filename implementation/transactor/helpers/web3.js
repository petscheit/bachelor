const ZkSwap = require("../contracts/ZkSwap.json")
const PairProxy = require("../contracts/PairProxy.json")
const IERC20 = require("../contracts/IERC20.json")
const getWeb3 = require("./getWeb3.js")
const Tx = require('ethereumjs-tx').Transaction
const Web3Utils = require('web3-utils');
const addresses = require("../shared/config.json").addresses;

const mweiToWei = require("../shared/conversion.js").mweiToWei

const privateKeySender = "04fb4507e72398b4e7461e717d999cbc7d91bb5da10ac0cf38b00446c2be696d"
const addressSender = "0xcc08e5636A9ceb03917C1ac7BbEda23aD57766F3"

const chain = 'ropsten'

const getBalanceEvents = async function() {
    const instance = await getContractInstance();
    let events = await instance.getPastEvents("BalanceUpdate", { fromBlock: "earliest" });
    return events;
}

const getContractInstance = async () => {
    const web3 = await getWeb3(chain);
    const networkId = await web3.eth.net.getId();
    return new web3.eth.Contract(
        ZkSwap.abi,
        addresses.zkSwap
    );
}

const getProxyInstance = async () => {
    const web3 = await getWeb3(chain);
    return new web3.eth.Contract(
        PairProxy.abi,
        addresses.proxy
    );
}

const getERC20Instance = async (address) => {
    const web3 = await getWeb3(chain);
    return new web3.eth.Contract(
        IERC20.abi,
        address
    );
}


const verifyTradeOnchain = async (balanceTxObject, proofObject, direction, deltaEth, deltaToken, newRoot) => {
    const web3 = await getWeb3(chain);
    let instance = await getProxyInstance();
    const data = instance.methods.verifyTrade(
        balanceTxObject,
        direction,
        deltaEth,
        deltaToken,
        newRoot,
        proofObject.proof.a,
        proofObject.proof.b,
        proofObject.proof.c,
        proofObject.inputs
    ).encodeABI();
    console.log("Data: ", data)
    const txData = buildTxData(addressSender, addresses.proxy, 0, data)
    await sendRawTransaction(txData, web3)
        .then(res => {
            console.log(res)
        })
    console.log("Verification complete")
}

const getLatestPrice = async function() {
  let instance = await getContractInstance();
  return instance.methods.ethToToken().call()
    .then(async (res) => {
      let tokenToEth = await instance.methods.tokenToEth().call()
      //min to max price
      return{
        ethPrice: [(res / 10000000000000000).toFixed(12), (10000000000000000 / tokenToEth).toFixed(12)],
        tokenPrice: [(tokenToEth / 10000000000000000).toFixed(12), (10000000000000000 / res).toFixed(12)],
        ethToToken: (res / 1000000).toFixed(0),
        tokenToEth: (tokenToEth / 10000).toFixed(0)
      }
    })
}

const trade = async (trade) => {
    if(trade.direction === 0){
        ethForTokens(mweiToWei(trade.input), mweiToWei(trade.output));
    } else {
        tokensForEth(mweiToWei(trade.input), mweiToWei(trade.output));
    }
}

const ethForTokens = async (amountEth, minAmountOut) => {
    console.log("ethForTokens")
    console.log("Eth amount:", amountEth)
    console.log("min returned:", minAmountOut)
    const web3 = await getWeb3(chain);
    let instance = await getProxyInstance();
    const data = instance.methods.ethForToken(minAmountOut, amountEth).encodeABI();
    const txData = buildTxData(addressSender, addresses.proxy, amountEth, data)

    await sendRawTransaction(txData, web3)
    console.log("Swap complete")
}

const tokensForEth = async (amountToken, minAmountOut) => {
    const web3 = await getWeb3(chain);
    let instance = await getProxyInstance();
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
exports.getBalanceEvents = getBalanceEvents;
exports.getContractInstance = getContractInstance;
exports.getProxyInstance = getProxyInstance;
exports.trade = trade;
exports.getLatestPrice = getLatestPrice;
