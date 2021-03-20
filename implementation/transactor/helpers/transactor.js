const TransactorMerkle = require("./transactorMerkle") 
const { getContractInstance, verifyTradeOnchain, getProxyInstance, trade, getLatestPrice } = require("./web3");
const ZokratesHelper = require("./zokrates");
const { ethToMwei, toBN } = require("../shared/conversion");

const Aggregator = require("./aggregator");
const assert = require('assert').strict;
const fs = require('fs');

class Transactor {
  constructor(){
    this.tradePool = [];
    this.tradePoolLeafIndex = [];
    this.merkle = new TransactorMerkle();
    this.zokratesHelper = new ZokratesHelper();
    this.aggregator = new Aggregator();
    this.poolTraders = [];
    this.latestPrices;
  }

  async init() {
    await this.merkle.init()
    this.merkle.calcInitialRoots()
    this.latestPrices = await getLatestPrice();
  }

  async invokeSwapListener() {
    const instance = await getContractInstance();
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
          this.merkle.updateBalance(event.returnValues["_from"], toBN(event.returnValues.ethAmount), toBN(event.returnValues.tokenAmount), event.returnValues.nonce)
          this.merkle.calcInitialRoots()
        }
        latestBlockNumber = event.blockNumber;
      }
    )
  }

  async invokeProxyListener() {
    let instance = await getProxyInstance();
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
        console.log(event)
        if(event.blockNumber !== latestBlockNumber){
            const caughtEvent = event.event;
            this.updateBalanceAndVerify(event)
            latestBlockNumber = event.blockNumber;
        }
      }
    )
  }

  addTrade(reqBody){
    console.log(this.latestPrices)
    assert.ok(this.merkle.checkTrade(reqBody, this.latestPrices))
    assert.ok(!this.poolTraders.includes(reqBody.address))
    this.tradePool.push(reqBody)
    this.poolTraders.push(reqBody.address)
    this.tradePoolLeafIndex.push(this.merkle.checkForKnowUser(reqBody.address))
    console.log(this.tradePool[this.tradePool.length - 1])
  }

  async triggerTradeAggregation(){
    const minimalTrade = this.aggregator.generateMinimalTrade(this.tradePool);
    console.log(minimalTrade);
    trade(minimalTrade);
  }

  async updateBalanceAndVerify(event){
    console.log("Updating Balances...")
    // currently we do not update the balances. Should be integrated here though.
    console.log(event)
    const balances = this.aggregator.start(this.tradePool);
    const proofData = this.merkle.getMulti(this.tradePoolLeafIndex);
    this.zokratesHelper.prepareTrade(balances[0], balances[1], proofData[0], proofData[1], proofData[2])
    const newRoot = this.merkle.calcNewRoot(balances[1])
    this.zokratesHelper.computeWitness(this.latestPrices.ethToToken, this.latestPrices.tokenToEth)
      .then(proofObject => {
        console.log(proofObject)
        const balancesTxObject = this.aggregator.buildBalanceTxObject(balances[1])
        verifyTradeOnchain(balancesTxObject, proofObject, balances[2], newRoot)
        .then(() => {
          
          console.log("Eagle has landed")
          this.resetTradePool();
        })
      })
  }

  async resetTradePool() {
    this.latestPrices = await getLatestPrice();
    this.tradePool = [];
    this.tradePoolLeafIndex = [];
  }
}

module.exports = Transactor

// FAILING:
// ["0xe3cd1fa70ee690a8d4c628d209d1b7d0a77ca8daf6bf535ea3dae9cba8f3a5af","0xd51dc58f07624ae20feb399b0b3eda223139b6ebb073aaf6e4b9b3073e8cb92b,0xaa2fe792eda0babe889135a2e0eb5ae35c804a900e4d7ca5fb9a7605518c53f9,0x8806ef876dcff6e352da4da4e1bc4cda3a8f49ba963c3846c2ad9488f67b89ed,0x24cd5a4f7fb8e4bb26e6f7987fcbc24977febf50d358b6df5a3f79aa0af2a29a,0xd7d6180b37ccc4205427cf9f2fee20c3e5e991837d285a902ace0a24c009396f,0x1ade3109f7cc9479e32e0dc1973ad189a0dbc71cff3220a18afcfc573b8b4e9b,0x8726a93e85299b01b30ef9047ea3b8a95d72ebf69f724734301d029ed87af75e"], ["0x1864237c0107c80c0ca87bd3cefa1d21bf9c65d5212b8fdbc859b9790993f8ba","0x4c7b77219cfbff310c2494b58a1c8d6fbd0643ad659c2810a795ffbd510b2585,0x2a6a0b55abf1014b619d8be55afb8567f90c2af0b2f85ca9bd7c1cfa9eb8d0a0,0xa75302b096a66a65d80ff923dda83e8ca6a29cb9935a10028c850d92a648a4c0,0x7e60b89111726223d0ffdfa7bc7ec24c0dac7cb1a8bc2e84937e5feb872adf2e,0x94cda1ef0455d073efb5421a20752157ee9cfe898c41fd8f7aba0f60f105745a,0xc1f615a1a5d5a49b51949e655d99c9cebd37b0b58d21644bff4769448226f26f,0xfa06218cda9f4c0060657fec0c5c1a360f61d30b97d93c0e983c1755943e2af6"], 2000000000000000000, 61200000000000000000, 2, 1000000000000000000
// ["0xe3cd1fa70ee690a8d4c628d209d1b7d0a77ca8daf6bf535ea3dae9cba8f3a5af","0xd51dc58f07624ae20feb399b0b3eda223139b6ebb073aaf6e4b9b3073e8cb92b,0xaa2fe792eda0babe889135a2e0eb5ae35c804a900e4d7ca5fb9a7605518c53f9,0x8806ef876dcff6e352da4da4e1bc4cda3a8f49ba963c3846c2ad9488f67b89ed,0x24cd5a4f7fb8e4bb26e6f7987fcbc24977febf50d358b6df5a3f79aa0af2a29a,0xd7d6180b37ccc4205427cf9f2fee20c3e5e991837d285a902ace0a24c009396f,0x1ade3109f7cc9479e32e0dc1973ad189a0dbc71cff3220a18afcfc573b8b4e9b,0x8726a93e85299b01b30ef9047ea3b8a95d72ebf69f724734301d029ed87af75e"], ["0x5c76a9c473940317861f53754c03ed1a4b5bd7ef16c71fe76f481529c144c6cb","0x86ee657fe8232703b0beb76dbb63f4c6f5d0778501bcc49520283141e733235a,0x2a6a0b55abf1014b619d8be55afb8567f90c2af0b2f85ca9bd7c1cfa9eb8d0a0,0xa75302b096a66a65d80ff923dda83e8ca6a29cb9935a10028c850d92a648a4c0,0x7e60b89111726223d0ffdfa7bc7ec24c0dac7cb1a8bc2e84937e5feb872adf2e,0x94cda1ef0455d073efb5421a20752157ee9cfe898c41fd8f7aba0f60f105745a,0xc1f615a1a5d5a49b51949e655d99c9cebd37b0b58d21644bff4769448226f26f,0xfa06218cda9f4c0060657fec0c5c1a360f61d30b97d93c0e983c1755943e2af6"], 2000000000000000000, 61200000000000000000, 2, 1000000000000000000

// ["0x47553a199ba", "0x0", "0xe8d4a51000"],["0x3328b944c4000", "0x128dbec0e000", "0x251b7d81c000"],[2,2,2],["0x31b878918679d9DA1DB277B1A2fD67Aa01032920", "0x1D539b717035B80240d6e7836B2C752E204B7DD4", "0x4d9b01D711c908833f97ea78CF2AE0C774607a4d"]