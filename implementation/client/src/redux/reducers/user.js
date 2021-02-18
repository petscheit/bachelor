import { ADD_BALANCE, ADD_ADDRESS, ADD_REGISTRATION } from "../actionTypes";

const initialState = {
    balance: null,
    address: null,
    registered: false
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
        case ADD_REGISTRATION: {
            return {
                ...state,
                registered: action.payload.status
            }
        }
        default:
            return state;
    }
}