const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const mnemonic = "urban club famous payment village feature ensure aisle labor anger smooth spray";
module.exports = {
  // Uncommenting the defaults below 
  // provides for an easier quick-start with Ganache.
  // You can also follow this format for other networks;
  // see <http://truffleframework.com/docs/advanced/configuration>
  // for more details on how to specify configuration options!
  //
    contracts_build_directory: path.join(__dirname, "contracts/build"),
    networks: {
        skipDryRun: true,
        development: {
          host: "localhost",     // Localhost (default: none)
          port: 8545,            // Standard Ethereum port (default: none)
          network_id: "*",       // Any network (default: none)
        },
         ropsten: {
            skipDryRun: true,
            provider: function() {
              return new HDWalletProvider(mnemonic, "https://ropsten.infura.io/v3/fda2def6a29f4d429611069341f5897c")
            },
            network_id: 3
        }

    },
    compilers: {
      solc: {
        version: "0.7.6",    // Fetch exact version from solc-bin (default: truffle's version)
        // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
        // settings: {          // See the solidity docs for advice about optimization and evmVersion
        //  optimizer: {
        //    enabled: false,
        //    runs: 200
        //  },
        //  evmVersion: "byzantium"
        // }
      }
    }
  //
};
