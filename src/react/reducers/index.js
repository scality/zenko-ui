import auth from './auth';
import bucket from './bucket';
import { combineReducers } from 'redux';
import configuration from './configuration';
import { connectRouter } from 'connected-react-router';
import instanceStatus from './instanceStatus';
import instances from './instances';
import networkActivity from './networkActivity';
import oidc from './oidc';
// import { reducer as oidcReducer } from 'redux-oidc';
import s3 from './s3';
import secrets from './secrets';
import stats from './stats';
import uiAccounts from './uiAccounts';
import uiBuckets from './uiBuckets';
import uiErrors from './uiErrors';
import uiLocations from './uiLocations';
import uiObjects from './uiObjects';
import uiUser from './uiUser';
import user from './user';
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
    uiErrors,
    uiLocations,
    uiObjects,
    uiUser,
    s3,
    secrets,
    stats,
    oidc,
    // oidc: oidcReducer,
    router: connectRouter(history),
    zenko: zenko,
});

export default zenkoUIReducer;
