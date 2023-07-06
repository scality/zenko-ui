import account from './account';
import auth from './auth';
import bucket from './bucket';
import { combineReducers } from 'redux';
import configuration from './configuration';
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
import uiEndpoints from './uiEndpoints';
import uiErrors from './uiErrors';
import uiLocations from './uiLocations';
import uiObjects from './uiObjects';
import uiUser from './uiUser';
import uiWorkflows from './uiWorkflows';
import zenko from './zenko';

const zenkoUIReducer = () =>
  combineReducers({
    account,
    auth,
    bucket,
    configuration,
    instanceStatus,
    instances,
    networkActivity,
    uiAccounts,
    uiBuckets,
    uiConfig,
    uiEndpoints,
    uiErrors,
    uiLocations,
    uiObjects,
    uiUser,
    uiWorkflows,
    s3,
    secrets,
    stats,
    oidc,
    zenko: zenko,
  });

export default zenkoUIReducer;
