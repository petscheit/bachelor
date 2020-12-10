const express = require("express");
const cors = require("cors");
const commander = require("commander");
const serverConfig = require("./config");
const ZkMerkleTree = require("./merkletree.js") 
const { getContractInstance } = require("./web3");
const assert = require('assert').strict;

commander
    .option("-h, --host <type>", "ip of relayer")
    .option("-p, --port <type>", "port of relayer")

commander.parse(process.argv);

const config = {
    port: commander.port || serverConfig.port,
    host: commander.host || serverConfig.host,
};

class Transactor {
  constructor(port, host){
    this.merkle = new ZkMerkleTree();
    this.port = port;
    this.host = host
    this.app = express();    
    this.tradePool = [];
  }

  async init() {
    await this.merkle.init()
    this.merkle.calcInitialRoots()
    this.app.use(express.json())
    this.app.use(cors())
    this.invokeListener()
  }

  async setupEndpoints() {
  /** 
   * GET endpoint
   */
    this.app.get("/", (req, res) => {
      try {
        res.status(200);
        res.json({
          test: "this is a test"
        });
      } catch (err) {
        console.error("GET /", err.message);
        res.status(400);
        res.send(err);
      }
    });

    this.app.get("/users", (req, res) => {
      try {
        res.status(200);
        const users = this.merkle.users
        res.json({
          users: users
        });
      } catch (err) {
        console.error("GET /", err.message);
        res.status(400);
        res.send(err);
      }
    });

    this.app.post("/trade", (req, res) => {
      try {
        assert.ok(this.merkle.checkTrade(req.body))
        this.tradePool.push(req.body)
        res.status(200);
        res.send()
        console.log(this.tradePool)
      } catch (err) {
        console.error("Post /trade", err.message);
        res.status(400);
        res.send(err);
      }
    })
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
        console.log("caughtEvent!")
        const caughtEvent = event.event;
        if(caughtEvent === "Registered"){
          this.merkle.addAddress(event.returnValues["_from"])
        } else if(caughtEvent === "Deposit"){
          this.merkle.updateBalance(event.returnValues.etherAmount, event.returnValues.tokenAmount, event.returnValues["_from"])
          this.merkle.calcInitialRoots()
        }
        latestBlockNumber = event.blockNumber;
      }
    )
  }

  listen() {
    this.app.listen(config.port, () => {
      console.log(`Transactor running at http://${config.host}:${config.port}/`);
    });
  }
}

(async () => {
  let server = new Transactor()
  await server.init()
  server.setupEndpoints()
  server.listen()

})()

