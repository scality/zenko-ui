import bucket from './bucket';
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import iamClient from './iamClient';
import networkActivity from './networkActivity';
import s3Client from './s3Client';
import secrets from './secrets';
import uiErrors from './uiErrors';
import user from './user';

const zenkoUIReducer = history => combineReducers({
    bucket,
    user,
    iamClient,
    networkActivity,
    uiErrors,
    s3Client,
    secrets,
    router: connectRouter(history),
});

export default zenkoUIReducer;
