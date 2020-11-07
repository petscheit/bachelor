const express = require("express");
const cors = require("cors");
const commander = require("commander");
const serverConfig = require("./config");

commander
    .option("-h, --host <type>", "ip of relayer")
    .option("-p, --port <type>", "port of relayer")

commander.parse(process.argv);

const config = {
    port: commander.port || serverConfig.port,
    host: commander.host || serverConfig.host,
};

const app = express();
app.use(express.json());
app.use(cors());
/** 
 * GET endpoint
 */
app.get("/", (req, res) => {
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

app.listen(config.port, () => {
  console.log(`Relayer running at http://${config.host}:${config.port}/`);
});