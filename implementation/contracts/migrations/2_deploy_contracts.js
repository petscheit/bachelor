const ZkSwap = artifacts.require("ZkSwap");
const Token = artifacts.require("Token");
const Verifier = artifacts.require("Verifier")

module.exports = async function(deployer) {
    await deployer.deploy(Token).then(async inst => {
      let tokenAddrs = inst.address
      let verifierAddrs = await deployer.deploy(Verifier).then(instance => instance.address)
      return deployer.deploy(ZkSwap, tokenAddrs, verifierAddrs);
    })
};
