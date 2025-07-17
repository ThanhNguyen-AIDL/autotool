import { createAction, createActionTypes } from "./commons";
// 📌 Action Types
const SET_FILES = 'logs/SET_FILES'; 
const SET_ENTITIES = 'logs/SET_ENTITIES'; 
const SET_SELECTED_FILE = 'logs/SET_SELECTED_FILE'; 


// 📌 Initial State
const initialState = {
    logFiles: [],
    logEntities: [],
    selectedFile: null
};


// 📌 Action Creators
export const setFileLogs = (list) => ({
    type: SET_FILES,
    payload: list,
});
export const setLogRecords = (list) => ({
    type: SET_ENTITIES,
    payload: list,
});

export const setSelectdFileLog = (text) => ({
    type: SET_SELECTED_FILE,
    payload: text,
});

const logReducer = (state = initialState, action) => {
    const handlers = {
        
        [SET_FILES]: (state, action) => ({ ...state, logFiles: action.payload }), // ✅ Added
        [SET_ENTITIES]: (state, action) => ({ ...state, logEntities: action.payload }), // ✅ Added
        [SET_SELECTED_FILE]: (state, action) => ({ ...state, selectedFile: action.payload }), // ✅ Added
        
        
    };

    return handlers[action.type] ? handlers[action.type](state, action) : state;

};

export default logReducer;
