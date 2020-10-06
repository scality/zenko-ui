import * as actions from '../../../actions';
import BucketCreate from '../BucketCreate';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { reduxMount, reduxMountAct } from '../../../utils/test';

// Jest requires a setter on the tested object but ES6 doesn't have
// but jest.mock() allows you solving this by mocking your required module after the import.
jest.mock('../../../actions', () => ({
    clearError: jest.fn(() => {
        return { type: 'CLEAR_ERROR' };
    }),
}));

describe('BucketCreate', () => {
    const errorMessage = 'This is an error test message';

    it('should render BucketCreate component with no error banner', async () => {
        const component = await reduxMountAct(<BucketCreate/>);
        expect(component.find('#zk-error-banner')).toHaveLength(0);
        // react-hook-form is set to validate on change.
        // UseForm hook will update state multiple time and component
        // will re-render as state updates.
        // This will cause state updates to occur even when we haven't fired an action.
        // However my test is only interested in the earlier state.
        // The errors were due to state that updated after the test finished.
        // The hook will clean up properly if unmounted
        component.unmount();
    });

    it('should render BucketCreate component with an error banner', async () => {
        const component = await reduxMountAct(<BucketCreate/>, {
            uiErrors: {
                errorMsg: errorMessage,
                errorType: 'byComponent',
            },
        });


        expect(component.find('#zk-error-banner')).toHaveLength(1);
        expect(component.find('#zk-error-banner').text()).toContain(errorMessage);
        component.unmount();
    });
});
