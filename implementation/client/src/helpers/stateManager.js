import { ClientMerkle } from "./clientMerkle.js";
import { toBN } from "../shared/conversion";
import store from '../redux/store';
import { invokeListener } from "./web3";
import { addBalance } from "../redux/actions";

class StateManager {
    constructor(){
        this.merkle = new ClientMerkle(); 
    }

    async initialSync() {
        await this.merkle.init()
        this.addBalanceFromHistory();
        await invokeListener()
        // this.merkle.calcInitialRoots()
    }

    addBalanceFromHistory() {
        store.dispatch(addBalance(this.merkle.getBalance(store.getState().user.address)))
    }

    updateBalance(ether, token, nonce, address) {
        const updatedBalance = this.merkle.updateBalance(toBN(ether), toBN(token), nonce, address);
        store.dispatch(addBalance(updatedBalance))
    }

    getDepositProof(address) {
        return this.merkle.getDepositProof(address);
    }

    getWithdrawProof(address, amount) {
        return this.merkle.getWithdrawProof(address, amount);
    }
}

export default StateManager;