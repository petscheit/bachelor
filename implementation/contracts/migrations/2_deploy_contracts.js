const ZkSwap = artifacts.require("ZkSwap");
const Verifier = artifacts.require("Verifier")
const addresses = require("../../shared/config").addresses
const PairProxy = artifacts.require("PairProxy");
const fs = require('fs');

module.exports = async function(deployer) {
  deployer.deploy(Verifier)
    .then(async (instance) => {
      let zks = await deployer.deploy(ZkSwap, addresses.zks, instance.address).then(zks => zks.address)
      let proxy = await deployer.deploy(PairProxy, zks).then(proxy => proxy.address)
      let file_content = fs.readFileSync('../shared/config.json');
      let content = JSON.parse(file_content);
      content.addresses.zkSwap = zks;
      content.addresses.proxy = proxy;
      fs.writeFileSync("../shared/config.json", JSON.stringify(content, null, 4));
    })
};
