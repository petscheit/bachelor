## zkSwap - Aggregating Uniswap Trades with zkRollup
This is a prototype implementation of zkRollup based transaction aggregation for Uniswap trades. It runs in Ethereum ropsten testnet, interacting with the Uniswap deployment. This implementation is limited is some regards compared to the proposed design. An aggregation must consist of three trades, otherwise the aggregation does not function. 

### Setup and Installation:
- run `npm install` in implementation directory

#### Aggregator:
- run `cd aggregator`
- run `npm install`
- run `curl -LSfs get.zokrat.es | sh` to install ZoKrates
- run `cd zokrates_circuit`
- run `zokrates compile -i singleMerkle.zok`. This will take some time
- run `zokrates setup`
- run `zokrates export-verifier`
- replace `../../contracts/contracts/verifier.sol` with the exported  verfier.sol

#### Contracts:
- run `cd contracts`
- run `truffle migrate --network ropsten`


#### Client:
- run `cd client`
- run `npm install`

### Start Application:
- go to client directory
- run `npm run start`
- go to aggregator directory
- run `npm run start`
- Open UI in browser http://localhost:3000/
- Funds can now be deposited and trades added
- Once three trades are added, aggregation can be triggered by sending a GET request to http://localhost:3005/multi

