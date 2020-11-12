import React from "react";
import { connect } from "react-redux";
import Register from "./Register";
import Deposit from "./Deposit";


class RegDepWrapper extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        console.log(this.props)
        if(!this.props.stateManager){
            return <div></div>
        }
        if(this.props.isRegistered){
            return <Deposit />
        }
        return <Register />
    }
}
const mapStateToProps = (state) => {
    return {
        isRegistered: state.user.isRegistered,
        stateManager: state.contract.stateManager
    }
}

export default connect(
    mapStateToProps
)(RegDepWrapper);