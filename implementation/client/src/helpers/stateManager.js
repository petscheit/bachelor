import { ZkMerkleTree } from "./merkletree.js";
import store from '../redux/store';
import { invokeListener, register } from "./web3";
import { addRegistration, addBalance } from "../redux/actions";

class StateManager {
    constructor(){
        this.merkle = new ZkMerkleTree(); 
    }

    async initialSync() {
        await this.merkle.init()
        this.addRegistrationStatus();
        this.addBalance();
        await invokeListener()
    }

    addRegistrationStatus() {
        store.dispatch(addRegistration(this.merkle.isUserRegistered(store.getState().user.address)))
    }

    addBalance() {
        store.dispatch(addBalance(this.merkle.getBalance(store.getState().user.address)))
    }

    getRegisterProof() {
        return this.merkle.getRegisterProof();
    }

    getDepositProof() {
        const address = store.getState().user.address;
        return this.merkle.getDepositProof(address);
    }
}

export default StateManager;