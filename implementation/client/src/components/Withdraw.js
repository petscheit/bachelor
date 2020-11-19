import React from "react";
import { connect } from "react-redux";
import { withdraw } from "../helpers/web3.js";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import { weiToEth } from "../helpers/conversion";
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';

class Withdraw extends React.Component {
    state = { amount: 0.0, token: 0 };

    constructor(props) {
        super(props);
    }

    handleChange = (e) => this.setState({ 
		amount: e.target.value 
    }) 
    
    handleTokenChange = (e) => this.setState({ 
		token: e.target.value 
	}) 

    render() {
        let classes = makeStyles((theme) => ({
            button: {
                margin: theme.spacing(1),
            },
        }));
        return (
            <Box margin="small">
                <FormControl className={classes.formControl}>
                    <InputLabel id="demo-simple-select-label">Token</InputLabel>
                    <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={this.state.token}
                    onChange={this.handleTokenChange}
                    >
                        <MenuItem value={0}>Ether</MenuItem>
                        <MenuItem value={1}>Bat</MenuItem>
                    </Select>
                </FormControl>
                <TextField // add upper bound
                    id="standard-number"
                    label="Amount to withdraw"
                    type="number"
                    value={this.state.amount} 
                    onChange={this.handleChange}
                />
                <Button 
                    onClick={() => { withdraw(this.state.amount, this.state.token) }}
                    variant="contained"
                    color="primary"
                    className={classes.button}
                >
                    Withdraw
                </Button>
            </Box>
        )
    }
}
const mapStateToProps = (state) => {
    return {
        isRegistered: state.user.isRegistered,
        stateManager: state.contract.stateManager,
        balance: state.user.balance.amount,
    }
}

export default connect(
    mapStateToProps
)(Withdraw);