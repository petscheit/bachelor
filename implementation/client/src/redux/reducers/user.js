import { UPDATE_BALANCE, ADD_ADDRESS } from "../actionTypes";

const initialState = {
    balance: null,
    address: null,
};

export default function (state = initialState, action) {
    switch (action.type) {
        case UPDATE_BALANCE: {
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
        default:
            return state;
    }
}