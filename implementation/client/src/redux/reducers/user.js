import { ADD_BALANCE, ADD_ADDRESS, ADD_REGISTRATION_STATUS } from "../actionTypes";

const initialState = {
    balance: null,
    address: null,
    isRegistered: false,
};

export default function (state = initialState, action) {
    switch (action.type) {
        case ADD_BALANCE: {
            return {
                ...state,
                balance: action.payload.balance
            };
        }
        case ADD_ADDRESS: {
            return {
                ...state,
                address: action.payload.address
            };
        }
        case ADD_REGISTRATION_STATUS: {
            return {
                ...state,
                isRegistered: action.payload.registered
            }
        }
        default:
            return state;
    }
}