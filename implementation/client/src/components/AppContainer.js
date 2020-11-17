import React from "react";
import { connect } from "react-redux";
import Register from "./Register";
import Deposit from "./Deposit";
import Withdraw from "./Withdraw";
import { makeStyles } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </Typography>
  );
}

class AppWrapper extends React.Component {
    state = { value: 0 }

    constructor(props) {
        super(props);
    }

    handleChange = (event, value) => {
        this.setState({
            value
        });
    };

    render() {
        if(!this.props.stateManager){
            return <div></div>
        }
        if(this.props.isRegistered){
            return (
                <div>
                    <AppBar position="static" color="default">
                        <Tabs
                            value={this.state.value}
                            onChange={this.handleChange}
                            indicatorColor="primary"
                            textColor="primary"
                            scrollButtons="auto"
                        >
                            <Tab label="TRADE" />
                            <Tab label="DEPOSIT" />
                            <Tab label="WITHDRAW" />
                        </Tabs>
                    </AppBar>
                    <Container background="light-2">
                        <Box>
                            {this.state.value === 0 && <TabContainer>TRADE </TabContainer>}
                            {this.state.value === 1 && <TabContainer><Deposit /></TabContainer>}
                            {this.state.value === 2 && <TabContainer><Withdraw /></TabContainer>}
                        </Box>
                    </Container>
                </div>
            )
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
)(AppWrapper);