const express = require("express");
const cors = require("cors");
const commander = require("commander");
const serverConfig = require("./shared/config");

const Transactor = require("./helpers/transactor");

commander
    .option("-h, --host <type>", "ip of relayer")
    .option("-p, --port <type>", "port of relayer")

commander.parse(process.argv);

const config = {
    port: commander.port || serverConfig.port,
    host: commander.host || serverConfig.host,
};

class Server {
  constructor(port, host){
    this.port = port;
    this.host = host
    this.app = express();   
    this.transactor = new Transactor();
  }

  async init() {
    await this.transactor.init()
    this.app.use(express.json())
    this.app.use(cors())
    // this.transactor.invokeSwapListener()
    this.transactor.invokeProxyListener()
  }

  async setupEndpoints() {
  /** 
   * GET endpoint
   */
    this.app.get("/multi", (req, res) => {
      // try {
        res.status(200);
        this.transactor.triggerTradeAggregation()
        res.json({
          result: "Trade aggregation started!"
        });
      // } catch (err) {
      //   console.error("GET /", err.message);
      //   res.status(400);
      //   res.send(err);
      // }
    });

    this.app.post("/trade", (req, res) => {
      try {
        this.transactor.addTrade((req.body))
        res.status(200);
        res.json({
          result: "Success!"
        })
      } catch (err) {
        console.error("Post /trade", err.message);
        res.status(400);
        res.send(err);
      }
    })
  }

  listen() {
    this.app.listen(config.port, () => {
      console.log(`Transactor running at http://${config.host}:${config.port}/`);
    });
  }
}

(async () => {
  let server = new Server()
  await server.init()
  server.setupEndpoints()
  server.listen()
  let res = await server.transactor.benchmarkMulti(30)
  console.log(res)

})()

