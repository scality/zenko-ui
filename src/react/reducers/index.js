import auth from './auth';
import bucket from './bucket';
import { combineReducers } from 'redux';
import configuration from './configuration';
import { connectRouter } from 'connected-react-router';
import instanceStatus from './instanceStatus';
import instances from './instances';
import networkActivity from './networkActivity';
import { reducer as oidcReducer } from 'redux-oidc';
import secrets from './secrets';
import stats from './stats';
import uiAccount from './uiAccount';
import uiBucket from './uiBucket';
import uiErrors from './uiErrors';
import uiLocation from './uiLocation';
import uiUser from './uiUser';
import user from './user';

const zenkoUIReducer = history => combineReducers({
    auth,
    bucket,
    configuration,
    user,
    instanceStatus,
    instances,
    networkActivity,
    uiAccount,
    uiBucket,
    uiErrors,
    uiLocation,
    uiUser,
    secrets,
    stats,
    oidc: oidcReducer,
    router: connectRouter(history),
});

export default zenkoUIReducer;
