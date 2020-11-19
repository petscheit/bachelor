const ZkSwap = artifacts.require("ZkSwap");
const Token = artifacts.require("Token");

module.exports = async function(deployer) {
    await deployer.deploy(Token).then(inst => {
      let addrs = inst.address
      return deployer.deploy(ZkSwap, addrs);
    })
};
