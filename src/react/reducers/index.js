import { combineReducers } from 'redux';
import iamClient from './iamClient';
import uiErrors from './uiErrors';
import user from './user';

const zenkoUIReducer = combineReducers({
    user,
    iamClient,
    uiErrors,
});

export default zenkoUIReducer;
