import React from 'react';
import { act } from 'react-dom/test-utils';
import { reduxMount } from '../../../utils/test';
import BucketCreate from '../BucketCreate';
import * as actions from "../../../actions";

// Jest requires a setter on the tested object but ES6 doesn't have
// but jest.mock() allows you solving this by mocking your required module after the import.
jest.mock('../../../actions', () => ({
    clearError: jest.fn(() => {
        return {type: 'CLEAR_ERROR'};
    })
}));

describe('BucketCreate', () => {
    const errorMessage = 'This is an error test message';

    it('should render BucketCreate component with no error banner', () => {
        const {component} = reduxMount(<BucketCreate/>);

        expect(component.find('#zk-error-banner')).toHaveLength(0);
    });

    it('should render BucketCreate component with an error banner', () => {
        const {component} = reduxMount(<BucketCreate/>, {
            uiErrors: {
                errorMsg: errorMessage,
                errorType: 'byComponent',
            },
        });


        expect(component.find('#zk-error-banner')).toHaveLength(1);
        expect(component.find('#zk-error-banner').text()).toContain(errorMessage);
    });

    // TESTING INPUT NAME:
    // 1) empty name input
    // 2) name input < 3 characters
    // 3) name input > 63 characters

    const tests = [
        {
            description: 'should render an input form error when submitting with an empty name',
            testValue: '',
            expectedEmptyNameError: 'Invalid Name',
            expectedMinLengthNameError: null,
            expectedMaxLengthNameError: null
        },
        {
            description: 'should render an input form error when submitting with an name.length < 3',
            testValue: 'ab',
            expectedEmptyNameError: null,
            expectedMinLengthNameError: 'Invalid Name',
            expectedMaxLengthNameError: null,
        },
        {
            description: 'should render an input form error when submitting with an name.length > 63',
            testValue: 'Z4VbHlmEKC0a8n85FEneHN6EhBwFSkmSh4tGOKy53ktdmQlwq5xJVi7hm32jFuKB',
            expectedEmptyNameError: null,
            expectedMinLengthNameError: null,
            expectedMaxLengthNameError: 'Invalid Name'
        }
    ];

    tests.forEach(t => {
        it(t.description, async () => {
            const {component} = reduxMount(<BucketCreate/>);

            await act(async () => {
                const input = component.find('input#name');
                input.getDOMNode().value = t.testValue;
                input.getDOMNode().dispatchEvent(new Event('input'));

                component.find('Button#create-account-btn').simulate('click');
            });

            if (t.expectedEmptyNameError != null) {
                expect(component.find('ErrorInput#error-name').text()).toContain(t.expectedEmptyNameError);
            } else if (t.expectedMinLengthNameError != null) {
                expect(component.find('ErrorInput#error-name').text()).toContain(t.expectedMinLengthNameError);
            } else if (t.expectedMaxLengthNameError != null) {
                expect(component.find('ErrorInput#error-name').text()).toContain(t.expectedMaxLengthNameError);
            }

        });
    });

    it('Should not call clearServerError when clicking inside the component', () => {
        const clearError = jest.spyOn(actions, "clearError");

        const {component} = reduxMount(
            <BucketCreate/>, {
                uiErrors: {
                    errorMsg: "error",
                    errorType: 'byComponent',
                },
            }
        );


        const cancelButton = component.findWhere(n => n.name() === 'Button' && n.prop('outlined') === true);
        cancelButton.simulate('click');

        expect(clearError).toHaveBeenCalled()
    });
});
