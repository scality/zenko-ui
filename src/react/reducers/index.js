import bucket from './bucket';
import { combineReducers } from 'redux';
import configuration from './configuration';
import { connectRouter } from 'connected-react-router';
import iamClient from './iamClient';
import networkActivity from './networkActivity';
import pensieveClient from './pensieveClient';
import s3Client from './s3Client';
import secrets from './secrets';
import stats from './stats';
import uiErrors from './uiErrors';
import user from './user';

const zenkoUIReducer = history => combineReducers({
    bucket,
    configuration,
    user,
    iamClient,
    networkActivity,
    uiErrors,
    pensieveClient,
    s3Client,
    secrets,
    stats,
    router: connectRouter(history),
});

export default zenkoUIReducer;
