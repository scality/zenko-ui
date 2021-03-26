import AccountCreate from '../AccountCreate';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { reduxMountAct } from '../../utils/test';

describe('AccountCreate', () => {
    it('should render AccountCreate component with no error banner', async () => {
        const component = await reduxMountAct(<AccountCreate/>);

        expect(component.find('#zk-error-banner')).toHaveLength(0);
        component.unmount();
    });

    it('should render AccountCreate component with error banner', async () => {
        const errorMessage = 'error message test';
        const component = await reduxMountAct(<AccountCreate/>, {
            uiErrors: {
                errorMsg: errorMessage,
                errorType: 'byComponent',
            },
        });

        expect(component.find('#zk-error-banner')).toHaveLength(1);
        expect(component.find('#zk-error-banner').text()).toContain(errorMessage);
        component.unmount();
    });

    // * error input
    //   * button click

    const tests = [
        {
            description: 'should render no error if both name and email are valid',
            name: 'ba',
            email: 'test@test.com',
            expectedNameError: '',
            expectedEmailError: '',
        },
        {
            description: 'should render no error if name, email and quota are valid',
            name: 'ba',
            email: 'test@test.com',
            expectedNameError: '',
            expectedEmailError: '',
        },
        {
            description: 'should render error if name is missing',
            name: '',
            email: 'test@test.com',
            expectedNameError: '"Name" is not allowed to be empty',
            expectedEmailError: '',
        },
        {
            description: 'should render error if email is missing',
            name: 'bart',
            email: '',
            expectedNameError: '',
            expectedEmailError: '"Root Account Email" is not allowed to be empty',
        },
        {
            description: 'should render 2 errors if name and email are missing',
            name: '',
            email: '',
            expectedNameError: '"Name" is not allowed to be empty',
            expectedEmailError: '"Root Account Email" is not allowed to be empty',
        },
        {
            description: 'should render error if name is too short',
            name: 'b',
            email: 'test@test.com',
            expectedNameError: '"Name" length must be at least 2 characters long',
            expectedEmailError: '',
        },
        {
            description: 'should render error if name is too long (> 64)',
            name: 'b'.repeat(65),
            email: 'test@test.com',
            expectedNameError: '"Name" length must be less than or equal to 64 characters long',
            expectedEmailError: '',
        },
        {
            description: 'should render error if name is invalid',
            name: '^^',
            email: 'test@test.com',
            expectedNameError: 'Invalid Name',
            expectedEmailError: '',
        },
        {
            description: 'should render error if email is invalid',
            name: 'bart',
            email: 'invalid',
            expectedNameError: '',
            expectedEmailError: 'Invalid Root Account Email',
        },
        {
            description: 'should render error if email is too long (> 256)',
            name: 'bart',
            email: `${'b'.repeat(257)}@long.com`,
            expectedNameError: '',
            expectedEmailError: '"Root Account Email" length must be less than or equal to 256 characters long',
        },
        {
            description: 'should render error if quota is invalid',
            name: 'bart',
            email: 'test@test.com',
            expectedNameError: '',
            expectedEmailError: '',
        },
        {
            description: 'should render error if quota is set to 0',
            name: 'bart',
            email: 'test@test.com',
            expectedNameError: '',
            expectedEmailError: '',
        },
    ];

    tests.forEach(t => {
        it(`Simulate click: ${t.description}`, async () => {
            const component = await reduxMountAct(<AccountCreate/>);
            // NOTE: All validation methods in React Hook Form are treated
            // as async functions, so it's important to wrap async around your act.
            await act(async () => {
                const elementName = component.find('input#name');
                elementName.getDOMNode().value = t.name;
                elementName.getDOMNode().dispatchEvent(new Event('input'));

                const elementEmail = component.find('input#email');
                elementEmail.getDOMNode().value = t.email;
                elementEmail.getDOMNode().dispatchEvent(new Event('input'));

                await act(async () => {
                    component.find('Button#create-account-btn').simulate('click');
                });

            });

            if (t.expectedNameError) {
                expect(component.find('ErrorInput#error-name').text()).toContain(t.expectedNameError);
            } else {
                expect(component.find('ErrorInput#error-name').text()).toBeFalsy();
            }
            if (t.expectedEmailError) {
                expect(component.find('ErrorInput#error-email').text()).toContain(t.expectedEmailError);
            } else {
                expect(component.find('ErrorInput#error-email').text()).toBeFalsy();
            }
            component.unmount();
        });
    });
});
