import React from "react";
import { connect } from "react-redux";
import Typography from '@material-ui/core/Typography';
import { weiToEth } from "../shared/conversion";

class Balance extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Typography style={{ flex: 1, textAlign: 'right' }}>
                Balance:  { weiToEth(this.props.etherBalance)} Eth,  { weiToEth(this.props.tokenBalance) } Bat   
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