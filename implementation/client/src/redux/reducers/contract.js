import { ADD_INSTANCE } from "../actionTypes";

const initialState = {
    instance: null
};

export default function (state = initialState, action) {
    switch (action.type) {
        case ADD_INSTANCE: {
            return {
                ...state,
                instance: action.payload.instance
            };
        }
        default:
            return state;
    }
}