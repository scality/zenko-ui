import { combineReducers } from 'redux';
import iamClient from './iamClient';
import secrets from './secrets';
import uiErrors from './uiErrors';
import user from './user';

const zenkoUIReducer = combineReducers({
    user,
    iamClient,
    uiErrors,
    secrets,
});

export default zenkoUIReducer;
