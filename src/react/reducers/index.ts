import { combineReducers } from 'redux';

const placeholderReducer = (state = {}) => state;

const zenkoUIReducer = () =>
  combineReducers({
    _placeholder: placeholderReducer,
  });

export default zenkoUIReducer;
