import { ADD_INSTANCE, ADD_STATE_MANAGER, ADD_ERC } from "../actionTypes";

const initialState = {
    instance: null,
    erc: null,
    stateManager: null,
};

export default function (state = initialState, action) {
    switch (action.type) {
        case ADD_INSTANCE: {
            return {
                ...state,
                instance: action.payload.instance
            };
        }
        case ADD_ERC: {
            return {
                ...state,
                erc: action.payload.instance
            }
        }
        case ADD_STATE_MANAGER: {
            return {
                ...state,
                stateManager: action.payload.instance //this seems very wrong....
            }
        }
        default:
            return state;
    }
}