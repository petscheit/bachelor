import React from "react";
import { connect } from "react-redux";
import { deposit, getLatestPrice } from "../helpers/web3.js";
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
import { ethIntToWeiBN, ethToWei, toBN, ethToMwei, mweiToEth } from "../shared/conversion";

class Trade extends React.Component {
    state = { amount: 0, token: 0, baseRate: 0 }; // Baserate: Ether to token in WEI

    constructor(props) {
        super(props);
        getLatestPrice()
            .then(res => {
                this.setState({baseRate: res})
            })
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
		token: Number(e.target.value)
    }) 
    
    buildTradeObject = () => {
        if(this.state.token === 0) {
            const ethDelta = toBN(this.state.amount); //Mwei
            const tokenDelta = toBN((this.state.amount * this.state.baseRate).toFixed(0));
            return {
                ethAmount: this.props.balance.ethAmount.toJSON(), 
                tokenAmount: this.props.balance.tokenAmount.toJSON(), 
                nonce: this.props.balance.nonce, 
                direction: this.state.token,
                deltaEth: ethDelta.toJSON(), //wei
                deltaToken: tokenDelta.toJSON(),
                address: this.props.address,
            }
        } else {
            
            const tokenDelta = toBN(this.state.amount); 
            console.log(this.state.amount)
            console.log(this.state.baseRate)
            console.log(toBN((this.state.amount / this.state.baseRate).toFixed()))
            const ethDelta = toBN((this.state.amount / this.state.baseRate).toFixed());
            console.log(ethDelta.toString())
            return {
                ethAmount: this.props.balance.ethAmount.toJSON(), 
                tokenAmount: this.props.balance.tokenAmount.toJSON(), 
                nonce: this.props.balance.nonce,
                direction: this.state.token,
                deltaEth: ethDelta.toJSON(), 
                deltaToken: tokenDelta.toJSON(),
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
                        <MenuItem value={1}>ZKS</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    id="standard-number"
                    label="Amount to trade"
                    type="number"
                    value={mweiToEth(this.state.amount)} 
				    onChange={this.handleAmountChange}
                />
                <Typography component="div" style={{ padding: 8 * 3 }}>
                    Min received: { this.state.token === 0 ? mweiToEth((this.state.amount * this.state.baseRate).toFixed()) : mweiToEth((this.state.amount / this.state.baseRate).toFixed()) }
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