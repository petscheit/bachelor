import {
    ADD_BALANCE,
    ADD_INSTANCE,
    ADD_ADDRESS,
    ADD_REGISTRATION_STATUS,
    ADD_STATE_MANAGER
} from "./actionTypes";

export const addInstance = (instance) => ({
    type: ADD_INSTANCE,
    payload: {
        instance
    }
})

export const addStateManager = (instance) => ({
    type: ADD_STATE_MANAGER,
    payload: {
        instance
    }
})

export const addBalance = (balance) => ({
    type: ADD_BALANCE,
    payload: {
        balance
    }
})

export const addAddress = (address) => ({
    type: ADD_ADDRESS,
    payload: {
        address
    }
})

export const addRegistration = (registered) => ({
    type: ADD_REGISTRATION_STATUS,
    payload: {
        registered
    }
})