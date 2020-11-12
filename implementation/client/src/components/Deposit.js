import React from "react";
import { connect } from "react-redux";
import { deposit } from "../helpers/web3.js";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

class Deposit extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let classes = makeStyles((theme) => ({
            button: {
                margin: theme.spacing(1),
            },
        }));
        return (
            <Box margin="small">
                <Button 
                    onClick={() => { deposit(1) }}
                    variant="contained"
                    color="primary"
                    className={classes.button}
                >
                    Deposit
                </Button>
            </Box>
        )
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
)(Deposit);