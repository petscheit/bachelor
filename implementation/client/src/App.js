import "./App.css";
import React, { Component } from "react";
import { getWeb3 } from "./helpers/getWeb3.js";
import ZkSwap from "./contracts/ZkSwap.json";
import IERC20 from "./contracts/IERC20.json";
import  TopNav from "./components/TopNav"
import { connect } from "react-redux";
import { addAddress, addInstance, addStateManager, addERC } from "./redux/actions";
import StateManager from "./helpers/stateManager";
import AppContainer from "./components/AppContainer";


class App extends Component {
    constructor(props) {
        super(props);
        this.stateManager = null;
    }

    componentDidMount = async () => {
        try {
            // Get network provider and web3 instance.
            let web3 = await getWeb3();
            const accounts = await web3.eth.getAccounts();
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = ZkSwap.networks[networkId];
            const instance = new web3.eth.Contract(
              ZkSwap.abi,
              deployedNetwork.address,
            );
            const tokenInstance = new web3.eth.Contract(
              IERC20.abi,
              "0xbBaD87B6Fc1caa8b95Fa59af8cD1603884e3Cb9d"
            );
            
            this.props.addERC(tokenInstance)
            await this.props.addAddress(accounts[0]);
            await this.props.addInstance(instance)
            const stateManager = new StateManager()
            await stateManager.initialSync();
            this.props.addStateManager(stateManager)

        } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
            `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
        }
    };



    render() {
        if (!this.props.instance || !this.props.address || !this.props.balance) {
          return <div>Loading Web3, accounts, and contract...</div>;
        }
        return (
          <div>
              <TopNav />
              <div style={{marginTop: 64}}>
                <AppContainer />
              </div>
          </div>
        );
    }
}

// export default App;
const mapStateToProps = state => {
    return {
        address: state.user.address,
        instance: state.contract.instance,
        balance: state.user.balance
    }
};

const mapDispatchToProps = dispatch => ({
  addAddress: address => dispatch(addAddress(address)),
  addInstance: instance => dispatch(addInstance(instance)),
  addStateManager: instance => dispatch(addStateManager(instance)),
  addERC: instance => dispatch(addERC(instance))
})


export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App);

// export default App;
