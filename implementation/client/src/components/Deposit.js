import React from "react";
import { connect } from "react-redux";
import { deposit } from "../helpers/web3.js";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import { ethToMwei, mweiToEth } from "../shared/conversion";


class Deposit extends React.Component {
    state = { amount: 0, token: 1 };

    constructor(props) {
        super(props);
    }

    handleAmountChange = (e) => {
        if(e.target.value != ""){
            this.setState({ 
                amount: ethToMwei(Number(e.target.value).toFixed(6))
            }) 
        } else {
            this.setState({ 
                amount: 0
            }) 
        }
    }
    
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
                <TextField
                    id="standard-number"
                    label="Amount to deposit"
                    type="number"
                    value={mweiToEth(this.state.amount)} 
				    onChange={this.handleAmountChange}
                />
                <Button 
                    onClick={() => { deposit(this.state.amount, this.state.token) }}
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