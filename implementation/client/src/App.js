import "./App.css";
import React, { Component } from "react";
import getWeb3 from "./helpers/getWeb3.js";
import ZkSwap from "./contracts/ZkSwap.json";
import { connect } from "react-redux";
import { addAddress, addInstance } from "./redux/actions";
// import { invokeListener } from "./helpers/stateSync";

class App extends Component {
    constructor(props) {
        super(props);
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

            this.props.addAddress(accounts[0]);
            this.props.addInstance(instance)
           
            // invokeListener(instance, accounts[0], web3);
        } catch (error) {
        // Catch any errors for any of the above operations.
        alert(
            `Failed to load web3, accounts, or contract. Check console for details.`,
        );
        console.error(error);
        }
    };



    render() {
      return("yeahhh")
    }
}


// export default App;
const mapStateToProps = state => {
    return {
        // account: state.user.account,
        // web3: state.web3.instance,
        // projectContract: state.web3.projectContract,
        // address: state.project.address,
    }
};

const mapDispatchToProps = dispatch => ({
  addAddress: address => dispatch(addAddress(address)),
  addInstance: instance => dispatch(addInstance(instance)),
})


export default connect(
    mapStateToProps,
    mapDispatchToProps
)(App);

// export default App;
