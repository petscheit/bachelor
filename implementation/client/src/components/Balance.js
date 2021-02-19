import React from "react";
import { connect } from "react-redux";
import Typography from '@material-ui/core/Typography';
import { mweiToEth } from "../shared/conversion";

class Balance extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Typography style={{ flex: 1, textAlign: 'right' }}>
                Balance:  { mweiToEth(this.props.etherBalance)} Eth,  { mweiToEth(this.props.tokenBalance) } ZKS   
            </Typography>
        )
    }
}
const mapStateToProps = (state) => {
    return {
        etherBalance: state.user.balance ? state.user.balance.ethAmount.toString() : "0",
        tokenBalance: state.user.balance ? state.user.balance.tokenAmount.toString() : "0",
    }
}

export default connect(
    mapStateToProps
)(Balance);



// 10000000000000000000