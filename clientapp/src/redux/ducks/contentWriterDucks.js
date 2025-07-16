import { createAction, createActionTypes } from "./commons";
// 📌 Action Types
const SET_CONTENT = 'writer/SET_CONTENT'; // ✅ New action type
const SET_PROMT = 'writer/SET_PROMT'; // ✅ New action type


// 📌 Initial State
const initialState = {
    writerResponse: "",
    promtInput : ''
};


// 📌 Action Creators
export const setContentWriter = (text) => ({
    type: SET_CONTENT,
    payload: text,
});

export const setPromtWriter = (text) => ({
    type: SET_PROMT,
    payload: text,
});


// 📌 Selector
export const selectWriterContent = (state) => state.writerResponse;




const writerReducer = (state = initialState, action) => {
    const handlers = {
        
        [SET_CONTENT]: (state, action) => ({ ...state, writerResponse: action.payload }), // ✅ Added
        [SET_PROMT]: (state, action) => ({ ...state, promtInput: action.payload }), // ✅ Added
        
        
    };

    return handlers[action.type] ? handlers[action.type](state, action) : state;

};

export default writerReducer;
