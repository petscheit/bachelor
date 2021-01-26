const TransactorMerkle = require("./transactorMerkle") 
const { getContractInstance, verifyTrade } = require("./web3");
const ZokratesHelper = require("./zokrates");
const Aggregator = require("./aggregator");
const assert = require('assert').strict;

class Transactor {
  constructor(){
    this.tradePool = [];
    this.tradePoolLeafIndex = [];
    this.merkle = new TransactorMerkle();
    this.zokratesHelper = new ZokratesHelper();
    this.aggregator = new Aggregator();
    this.poolTraders = [];
  }

  async init() {
    await this.merkle.init()
    this.merkle.calcInitialRoots()
  }

  async invokeListener() {
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
        if(caughtEvent === "Registered"){
          this.merkle.addAddress(event.returnValues["_from"])
        } else if(caughtEvent === "Deposit"){
          this.merkle.updateBalance(event.returnValues.ethAmount, event.returnValues.tokenAmount, event.returnValues.nonce, event.returnValues["_from"])
          this.merkle.calcInitialRoots()
        }
        latestBlockNumber = event.blockNumber;
      }
    )
  }

  addTrade(reqBody){
    assert.ok(this.merkle.checkTrade(reqBody))
    assert.ok(!this.poolTraders.includes(reqBody.address))
    this.tradePool.push(reqBody)
    this.poolTraders.push(reqBody.address)
    this.tradePoolLeafIndex.push(this.merkle.getAddressIndex(reqBody.address))
    console.log(this.tradePool)
  }

  triggerTradeAggregation(){
    // const proofData = this.merkle.getMulti(this.tradePoolLeafIndex)
    // this.zokratesHelper.prepareTrade(this.tradePool, proofData[0], proofData[1], proofData[2])
    // const result = this.zokratesHelper.computeWitness()
    // console.log(result)
    const balances = this.aggregator.start(this.tradePool);
    const proofData = this.merkle.getMulti(this.tradePoolLeafIndex);
    this.zokratesHelper.prepareTrade(balances[0], balances[1], proofData[0], proofData[1], proofData[2])
    this.zokratesHelper.computeWitness()
      .then(proofObject => {
        console.log(proofObject)
        console.log("we are doneeeee, this time for reaal")
        const balancesTxObject = this.aggregator.buildBalanceTxObject(balances[1])
        verifyTrade(balancesTxObject, proofObject)

      })
  }
}

module.exports = Transactor