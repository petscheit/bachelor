import React from "react";
import { connect } from "react-redux";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';

class Register extends React.Component {
  constructor(props) {
    super(props);
  }

    render() {
        if(!this.props.stateManager){
            return <div></div>
        }
        if(this.props.isRegistered){
            return "you are registered!"
        }
        return "You are not registered"
    
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
)(Register);