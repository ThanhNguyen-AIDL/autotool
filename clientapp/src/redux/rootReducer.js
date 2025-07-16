import { combineReducers } from 'redux';
import writerReducer from './ducks/contentWriterDucks';

// Root reducer combining all individual reducers
const appReducer = combineReducers({
  writer: writerReducer,
});

// Root reducer wrapper to handle state reset
const rootReducer = (state, action) => {

  return appReducer(state, action);
};

export default rootReducer;
