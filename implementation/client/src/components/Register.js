import React from "react";
import { connect } from "react-redux";
import { register } from "../helpers/web3.js";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

class Register extends React.Component {
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
                    onClick={() => { register() }}
                    variant="contained"
                    color="primary"
                    className={classes.button}
                >
                    Register
                </Button>
            </Box>
        )
    }
}
const mapStateToProps = (state) => {
    return {
        // isRegistered: state.user.isRegistered,
        // stateManager: state.contract.stateManager
    }
}

export default connect(
    mapStateToProps
)(Register);