import * as actions from '../zenko';
import * as dispatchAction from './utils/dispatchActionsList';

import { MockZenkoClient } from '../../../js/mock/ZenkoClient';

import { testActionFunction } from './utils/testUtil';

describe('zenko actions', () => {
    const mock = new MockZenkoClient;
    const syncTests = [
        {
            it: 'should return SET_ZENKO_CLIENT action',
            fn: actions.setZenkoClient(mock),
            expectedActions: [dispatchAction.SET_ZENKO_CLIENT_ACTION(mock)],
        },
    ];

    syncTests.forEach(testActionFunction);
});
