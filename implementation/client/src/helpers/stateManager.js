import { ClientMerkle } from "./clientMerkle.js";
import { toBN } from "../shared/conversion";
import store from '../redux/store';
import { invokeListener } from "./web3";
import { addBalance, addRegistration } from "../redux/actions";

class StateManager {
    constructor(){
        this.merkle = new ClientMerkle(); 
    }

    async initialSync() {
        await this.merkle.init()
        this.addBalanceFromHistory();
        await invokeListener()
        this.merkle.calcInitialRoots()
    }

    addBalanceFromHistory() {
        const balance = this.merkle.getBalance(store.getState().user.address)
        if(balance){
            store.dispatch(addBalance(balance))
            store.dispatch(addRegistration(true))
        }
    }

    updateBalance(ether, token, nonce, address) {
        const updatedBalance = this.merkle.updateBalance(address, toBN(ether), toBN(token), nonce);
        store.dispatch(addBalance(updatedBalance))
        store.dispatch(addRegistration(true))
    }

    getDepositProof(address) {
        return this.merkle.getDepositProof(address);
    }

    getFirstDepositProof(address) {
        return this.merkle.getFirstDepositProof(address);
    }

    getWithdrawProof(address, amount) {
        return this.merkle.getWithdrawProof(address, amount);
    }
}

export default StateManager;