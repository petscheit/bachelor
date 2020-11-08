const ZkSwap = artifacts.require("ZkSwap");

module.exports = function(deployer) {
  deployer.deploy(ZkSwap);
};
