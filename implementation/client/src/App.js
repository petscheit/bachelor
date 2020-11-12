import "./App.css";
import React, { Component } from "react";
import { getWeb3 } from "./helpers/web3.js";
import ZkSwap from "./contracts/ZkSwap.json";
import  TopNav from "./components/TopNav"
import { connect } from "react-redux";
import { addAddress, addInstance, addStateManager } from "./redux/actions";
import StateManager from "./helpers/stateManager";
import RegDepWrapper from "./components/RegDepWrapper";
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';

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
        if (!this.props.instance || !this.props.address) {
          return <div>Loading Web3, accounts, and contract...</div>;
        }
        return (
          <div>
              <TopNav />
              <div style={{marginTop: 64}}>
                <Container background="light-2">
                    <Box>
                      <RegDepWrapper />

                    </Box>
                </Container>
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
    }
};

const mapDispatchToProps = dispatch => ({
  addAddress: address => dispatch(addAddress(address)),
  addInstance: instance => dispatch(addInstance(instance)),
  addStateManager: instance => dispatch(addStateManager(instance))
})


export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App);

// export default App;
