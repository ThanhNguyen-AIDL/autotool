import { combineReducers } from 'redux';
import writerReducer from './ducks/contentWriterDucks';
import categoryReducer from './ducks/categoryDucks';
import logReducer from './ducks/logDucks';

// Root reducer combining all individual reducers
const appReducer = combineReducers({
  writer: writerReducer,
  category: categoryReducer,
  logs: logReducer

});

// Root reducer wrapper to handle state reset
const rootReducer = (state, action) => {

  return appReducer(state, action);
};

export default rootReducer;
