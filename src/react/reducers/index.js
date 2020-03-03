import bucket from './bucket';
import { combineReducers } from 'redux';
import iamClient from './iamClient';
import s3Client from './s3Client';
import secrets from './secrets';
import uiErrors from './uiErrors';
import user from './user';

const zenkoUIReducer = combineReducers({
    bucket,
    user,
    iamClient,
    uiErrors,
    s3Client,
    secrets,
});

export default zenkoUIReducer;
