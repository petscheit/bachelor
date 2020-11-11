import {
    UPDATE_BALANCE,
    ADD_INSTANCE,
    ADD_ADDRESS,
} from "./actionTypes";

export const updateBalance = (balance) => ({
    type: UPDATE_BALANCE,
    payload: {
        balance
    }
})

export const addInstance = (instance) => ({
    type: ADD_INSTANCE,
    payload: {
        instance
    }
})

export const addAddress = (address) => ({
    type: ADD_ADDRESS,
    payload: {
        address
    }
})