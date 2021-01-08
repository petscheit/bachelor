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
import { broadcastTrade } from "../helpers/transactor";
import { ethIntToWeiBN, ethToWei, toBN } from "../shared/conversion";

class Trade extends React.Component {
    state = { amount: 0.0, token: 0, baseRate: 20.4 }; // Baserate: Ether to token in WEI

    constructor(props) {
        super(props);
    }

    handleAmountChange = (e) => this.setState({ 
		amount: Number(e.target.value)
    })
    
    handleTokenChange = (e) => this.setState({ 
		token: Number(e.target.value)
    }) 
    
    buildTradeObject = () => {
        const toWei = toBN(100000000000);
        if(this.state.token === 0) {
            const ethDelta = toBN(this.state.amount.toFixed(6) * 10000000); //Mwei
            const tokenDelta = toBN(Math.round((this.state.amount * (1 / this.state.baseRate)) * 10000000));
            return {
                ethAmount: this.props.balance.ethAmount.toJSON(), 
                tokenAmount: this.props.balance.tokenAmount.toJSON(), 
                nonce: this.props.balance.nonce, 
                direction: this.state.token,
                deltaEth: ethDelta.imul(toWei).toJSON(), //wei
                deltaToken: tokenDelta.imul(toWei).toJSON(),
                address: this.props.address,
            }
        } else {
            
            const tokenDelta = toBN(this.state.amount.toFixed(6) * 10000000); //Mwei
            const ethDelta = toBN(Math.round((this.state.amount * (1 / this.state.baseRate)) * 10000000)); // converted to Mwei, ensures we only use 6 decimal places
            return {
                ethAmount: this.props.balance.ethAmount.toJSON(), 
                tokenAmount: this.props.balance.tokenAmount.toJSON(), 
                nonce: this.props.balance.nonce,
                direction: this.state.token,
                deltaEth: ethDelta.imul(toWei).toJSON(), 
                deltaToken: tokenDelta.imul(toWei).toJSON(),
                address: this.props.address,
            }
        }
    }

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
                    label="Amount to trade"
                    type="Number"
                    value={this.state.amount} 
				    onChange={this.handleAmountChange}
                />
                <Typography component="div" style={{ padding: 8 * 3 }}>
                    Min received: { this.state.token === 0 ? (this.state.amount * this.state.baseRate).toFixed(6) : (this.state.amount * (1 / this.state.baseRate)).toFixed(6) }
                </Typography>
                <Button 
                    onClick={() => { broadcastTrade(this.buildTradeObject())}}
                    variant="contained"
                    color="primary"
                    className={classes.button}
                >
                    Trade
                </Button>
            </Box>
        )
    }
}
const mapStateToProps = (state) => {
    return {
        isRegistered: state.user.isRegistered,
        stateManager: state.contract.stateManager,
        balance: state.user.balance,
        address: state.user.address,
    }
}

export default connect(
    mapStateToProps
)(Trade);