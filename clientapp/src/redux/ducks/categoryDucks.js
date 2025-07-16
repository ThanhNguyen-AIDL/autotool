import { createAction, createActionTypes } from "./commons";
// 📌 Action Types
const SET_LIST = 'category/SET_LIST'; 


// 📌 Initial State
const initialState = {
    categories: [],
};


// 📌 Action Creators
export const setCategoryList = (list) => ({
    type: SET_LIST,
    payload: list,
});



const categoryReducer = (state = initialState, action) => {
    const handlers = {
        
        [SET_LIST]: (state, action) => ({ ...state, categories: action.payload }), // ✅ Added
        
        
    };

    return handlers[action.type] ? handlers[action.type](state, action) : state;

};

export default categoryReducer;
