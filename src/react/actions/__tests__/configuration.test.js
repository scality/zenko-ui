import * as actions from '../configuration';
import * as dispatchAction from './utils/dispatchActionsList';
import {
  LATEST_OVERLAY,
  initState,
  testActionFunction,
  testDispatchFunction,
} from './utils/testUtil';

describe('configuration actions', () => {
  const syncTests = [
    {
      it: 'should return CONFIGURATION_VERSION action',
      fn: actions.newConfiguration(LATEST_OVERLAY),
      expectedActions: [dispatchAction.CONFIGURATION_VERSION_ACTION],
    },
  ];

  syncTests.forEach(testActionFunction);

  const asyncTests = [
    {
      it: 'updateConfiguration: should return expected action',
      fn: actions.updateConfiguration(),
      storeState: initState,
      expectedActions: [dispatchAction.CONFIGURATION_VERSION_ACTION],
    },
  ];

  asyncTests.forEach(testDispatchFunction);
});
