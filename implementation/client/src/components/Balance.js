import React from "react";
import { connect } from "react-redux";
import Typography from '@material-ui/core/Typography';
const Web3Utils = require('web3-utils');

class Balance extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        if(this.props.balance) {
            console.log(typeof this.props.balance.toString())
            console.log(this.props.balance.amount.toString())
            console.log(this.props)
            return (
                <Typography style={{ flex: 1, textAlign: 'right' }}>
                    Balance:  { Web3Utils.fromWei(this.props.balance.amount.toString(), "ether")} Eth   
                </Typography>
            )
        }
        return (
            <Typography style={{ flex: 1, textAlign: 'right' }}>
                Balance:  0 Eth    
            </Typography>
        )
    }
}
const mapStateToProps = (state) => {
    return {
        balance: state.user.balance,
    }
}

export default connect(
    mapStateToProps
)(Balance);