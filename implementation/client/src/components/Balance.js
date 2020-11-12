import React from "react";
import { connect } from "react-redux";
import Typography from '@material-ui/core/Typography';
import { weiToEth } from "../helpers/conversion";

class Balance extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <Typography style={{ flex: 1, textAlign: 'right' }}>
                Balance:  { weiToEth(this.props.balance)} Eth   
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