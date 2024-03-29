import React from "react";
import { connect } from "react-redux";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Balance from "./Balance";

class TopNav extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
        return (
            <AppBar position="fixed">
                <Toolbar>
                    <Typography variant="h6">
                        zkSwap
                    </Typography>
                    <Balance />
                    <Typography style={{ flex: 1, textAlign: 'right' }}>
                        Account: {this.props.address}
                    </Typography>
                </Toolbar>
            </AppBar>
        );
  }
}
const mapStateToProps = (state) => {
    return {
        address: state.user.address,
    }
}

export default connect(
    mapStateToProps
)(TopNav);