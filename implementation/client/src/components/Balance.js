import React from "react";
import { connect } from "react-redux";
import Typography from '@material-ui/core/Typography';
const Web3Utils = require('web3-utils');

class Balance extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Typography style={{ flex: 1, textAlign: 'right' }}>
                Balance:  { Web3Utils.fromWei(this.props.balance, "ether")} Eth   
            </Typography>
        )
    }
}
const mapStateToProps = (state) => {
    return {
        balance: state.user.balance != null ? state.user.balance.amount.toString() : "0",
    }
}

export default connect(
    mapStateToProps
)(Balance);