export const createActionTypes = (base) => ({
    REQUEST: `${base}_REQUEST`,
    SUCCESS: `${base}_SUCCESS`,
    FAILURE: `${base}_FAILURE`,
});

export const createAction = (type, payload = {}) => ({ type, payload });
