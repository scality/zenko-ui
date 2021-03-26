import auth from './auth';
import bucket from './bucket';
import { combineReducers } from 'redux';
import configuration from './configuration';
import { connectRouter } from 'connected-react-router';
import iam from './iam';
import instanceStatus from './instanceStatus';
import instances from './instances';
import networkActivity from './networkActivity';
import oidc from './oidc';
import s3 from './s3';
import secrets from './secrets';
import stats from './stats';
import uiAccounts from './uiAccounts';
import uiBuckets from './uiBuckets';
import uiConfig from './uiConfig';
import uiErrors from './uiErrors';
import uiLocations from './uiLocations';
import uiObjects from './uiObjects';
import uiUser from './uiUser';
import uiWorkflows from './uiWorkflows';
import user from './user';
import workflow from './workflow';
import zenko from './zenko';

const zenkoUIReducer = history => combineReducers({
    auth,
    bucket,
    configuration,
    user,
    instanceStatus,
    instances,
    networkActivity,
    uiAccounts,
    uiBuckets,
    uiConfig,
    uiErrors,
    uiLocations,
    uiObjects,
    uiUser,
    uiWorkflows,
    s3,
    secrets,
    stats,
    oidc,
    router: connectRouter(history),
    workflow,
    zenko: zenko,
    iam,
});

export default zenkoUIReducer;
