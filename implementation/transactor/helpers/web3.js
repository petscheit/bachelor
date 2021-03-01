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

const verifyTradeOnchain = async (balanceTxObject, proofObject, combined, newRoot) => {
    const web3 = await getWeb3(chain);
    let instance = await getProxyInstance();
    console.log(balanceTxObject)
    const data = instance.methods.verifyTrade(
        balanceTxObject,
        combined.direction,
        combined.deltaEth,
        combined.deltaToken,
        newRoot,
        proofObject.proof.a,
        proofObject.proof.b,
        proofObject.proof.c,
        proofObject.inputs
    ).encodeABI();
    const txData = buildTxData(addressSender, addresses.proxy, 0, data)
    await sendRawTransaction(txData, web3)
        .then(res => {
            console.log(res)
        })
    console.log("Verification complete")
}

const getLatestPrice = async function() {
  let instance = await getContractInstance();
  return instance.methods.setTokenAmount().call()
    .then(res => {
      console.log("Calced price:", (res / 1000000000000000000).toFixed(6))
      return (res / 1000000000000000000).toFixed(6)
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
    const data = instance.methods.tokenForEth(minAmountOut * 0.9, amountToken).encodeABI(); 
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

const test = async () => {
    const web3 = await getWeb3(chain);
    const txData = {
        gasLimit: '0xc3500',
        gasPrice: '0xb2d05e00',
        to: '0x726a81e9B9d2ADE8255F2aab7e0e93c2d920897d',
        from: '0xcc08e5636A9ceb03917C1ac7BbEda23aD57766F3',
        value: '0x0',
        data: '0x3d0177ff00000000000000000000000000000000000000000000000000000000000001c0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007cf4332d400000000000000000000000000000000000000000000000000003876004331a01de020a31002777c6ea05f42b02ca01adde3e248ba75b079a3bc64cc5d8226780c8ac8e355fb87c0f8aac26bcbf53dab2186c84c633e0455feec1c7e3179f9b121ac6a0ba39a4efae812f829342908e00161953fcf7d5ee99403399becc84aae2848c36d9815af2db8321ac00543ef9c838e77383b124a41c26ac1a2688b8aae2104e658f2263de8171f5e79db304f821e27445dafe952c6e92f8643460dbf7d2b871e2798ed7ea2c13b41f234d5b607d19c1cf9c7021cc923e86554c0536cde2ff6702436e2cfecae61c1a64f959da98210c6fbd6ae206d39f474723316b79914735155f5d5724ba9b7f577b0716e3c4009f6de3ee66a210fd82f86ae545cc6000000000000000000000000000000008be737a0437061d2d309a67ba462b9f200000000000000000000000000000000a7590349dec7cb3b7c13f3362f6549f700000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000f7933b52c00000000000000000000000000000000000000000000000000004607f5a5d000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000031b878918679d9da1db277b1a2fd67aa0103292000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000542a15c8f0d000000000000000000000000000000000000000000000000000000000000000020000000000000000000000001d539b717035b80240d6e7836b2c752e204b7dd400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000542a15c8f0d000000000000000000000000000000000000000000000000000000000000000020000000000000000000000004d9b01d711c908833f97ea78cf2ae0c774607a4d'
    }
    sendRawTransaction(txData, web3)
}

// test();

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
