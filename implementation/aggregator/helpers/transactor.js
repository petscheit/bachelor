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
    this.merkle = new TransactorMerkle(256);
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
    console.log(event)
    let updateObject = this.aggregator.generateBalanceUpdates(this.tradePool)
    const proofData = this.merkle.getMerklePaths(this.tradePoolLeafIndex, updateObject.balanceUpdates);
    console.log(updateObject.balanceUpdates)
    updateObject.balanceUpdates = proofData[0]
    const oldRootInt = proofData[1]
    const newRoot = proofData[2]

    this.zokratesHelper.prepareTrade(updateObject.balanceUpdates, oldRootInt)
    this.zokratesHelper.computeWitness(this.latestPrices.ethToToken, this.latestPrices.tokenToEth)
      .then(proofObject => {
        const balancesTxObject = this.aggregator.buildBalanceTxObject(updateObject.balanceUpdates)
        verifyTradeOnchain(balancesTxObject, proofObject, updateObject.direction, updateObject.deltaEth, updateObject.deltaToken, newRoot)
        .then(() => {
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