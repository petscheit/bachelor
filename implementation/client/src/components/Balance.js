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
                Balance:  { weiToEth(this.props.etherBalance)} Eth,  { weiToEth(this.props.batBalance) } Bat   
            </Typography>
        )
    }
}
const mapStateToProps = (state) => {
    return {
        etherBalance: state.user.balance != null ? state.user.balance.ether.toString() : "0",
        batBalance: state.user.balance != null ? state.user.balance.token.toString() : "0",
    }
}

export default connect(
    mapStateToProps
)(Balance);