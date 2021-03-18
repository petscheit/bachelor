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
    state = { amount: 0, direction: 0, ethPrice: [0,0], tokenPrice: [0,0]}; // Baserate: Ether to token in WEI

    constructor(props) {
        super(props);
        getLatestPrice()
            .then(res => {
                this.setState({ethPrice: res.ethPrice, tokenPrice: res.tokenPrice})
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
		direction: Number(e.target.value)
    }) 
    
    buildTradeObject = () => {
        if(this.state.direction === 0) {
            const ethDelta = toBN(this.state.amount); //Mwei
            const tokenDelta = toBN((this.state.amount * this.state.ethPrice[0]).toFixed(0));
            return {
                ethAmount: this.props.balance.ethAmount.toJSON(), 
                tokenAmount: this.props.balance.tokenAmount.toJSON(), 
                nonce: this.props.balance.nonce, 
                direction: this.state.direction,
                deltaEth: ethDelta.toJSON(), //wei
                deltaToken: tokenDelta.toJSON(),
                address: this.props.address,
            }
        } else {
            
            const tokenDelta = toBN(this.state.amount); 
            const ethDelta = toBN((this.state.amount * this.state.tokenPrice[0]).toFixed());
            return {
                ethAmount: this.props.balance.ethAmount.toJSON(), 
                tokenAmount: this.props.balance.tokenAmount.toJSON(), 
                nonce: this.props.balance.nonce,
                direction: this.state.direction,
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
                    value={this.state.direction}
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
                <Typography component="div" style={{ padding: 8 * 3}}>
                    Min received: { this.state.direction === 0 ? mweiToEth((this.state.amount * this.state.ethPrice[0]).toFixed(0)) : mweiToEth((this.state.amount * this.state.tokenPrice[0]).toFixed()) }
                </Typography>
                <Typography component="div" style={{ padding: 8 * 3}}>
                    Max received: { this.state.direction === 0 ? mweiToEth((this.state.amount * this.state.ethPrice[1]).toFixed(0)) : mweiToEth((this.state.amount * this.state.tokenPrice[1]).toFixed()) }
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