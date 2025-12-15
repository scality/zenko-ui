import account from './account';
import auth from './auth';
import { combineReducers } from 'redux';
import configuration from './configuration';
import instanceStatus from './instanceStatus';
import instances from './instances';
import networkActivity from './networkActivity';
import oidc from './oidc';
import secrets from './secrets';
import stats from './stats';
import uiAccounts from './uiAccounts';
import uiErrors from './uiErrors';
import uiLocations from './uiLocations';
import uiUser from './uiUser';
import zenko from './zenko';

const zenkoUIReducer = () =>
  combineReducers({
    account,
    auth,
    configuration,
    instanceStatus,
    instances,
    networkActivity,
    uiAccounts,
    uiErrors,
    uiLocations,
    uiUser,
    secrets,
    stats,
    oidc,
    zenko: zenko,
  });

export default zenkoUIReducer;
