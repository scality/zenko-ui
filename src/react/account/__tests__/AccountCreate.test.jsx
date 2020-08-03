import AccountCreate from '../AccountCreate';
import React from 'react';
import { reduxMount } from '../../utils/test';

describe('AccountCreate', () => {
    it('should render AccountCreate component with no error banner', () => {
        const { component } = reduxMount(<AccountCreate/>);

        expect(component.find('#zk-error-banner')).toHaveLength(0);
    });

    it('should render AccountCreate component with error banner', () => {
        const errorMessage = 'error message test';
        const { component } = reduxMount(<AccountCreate/>, {
            uiErrors: {
                errorMsg: errorMessage,
                errorType: 'byComponent',
            },
        });

        expect(component.find('#zk-error-banner')).toHaveLength(1);
        expect(component.find('#zk-error-banner').text()).toContain(errorMessage);
    });

    // * error input
    //   * button click

    const tests = [
        {
            description: 'should render no error if both name and email are valid',
            name: 'ba',
            email: 'test@test.com',
            quota: '',
            expectedNameError: '',
            expectedEmailError: '',
            expectedQuotaError: '',
        },
        {
            description: 'should render no error if name, email and quota are valid',
            name: 'ba',
            email: 'test@test.com',
            quota: '1',
            expectedNameError: '',
            expectedEmailError: '',
            expectedQuotaError: '',
        },
        {
            description: 'should render error if name is missing',
            name: '',
            email: 'test@test.com',
            quota: '1',
            expectedNameError: 'Field cannot be left blank.',
            expectedEmailError: '',
            expectedQuotaError: '',
        },
        {
            description: 'should render error if email is missing',
            name: 'bart',
            email: '',
            quota: '1',
            expectedNameError: '',
            expectedEmailError: 'Field cannot be left blank.',
            expectedQuotaError: '',
        },
        {
            description: 'should render 2 errors if name and email are missing',
            name: '',
            email: '',
            quota: '1',
            expectedNameError: 'Field cannot be left blank.',
            expectedEmailError: 'Field cannot be left blank.',
            expectedQuotaError: '',
        },
        {
            description: 'should render error if name is too short',
            name: 'b',
            email: 'test@test.com',
            quota: '1',
            expectedNameError: 'Account name should be at least 2 characters long.',
            expectedEmailError: '',
            expectedQuotaError: '',
        },
        {
            description: 'should render error if name is too long (> 64)',
            name: 'b'.repeat(65),
            email: 'test@test.com',
            quota: '1',
            expectedNameError: 'The length of the property is too long. The maximum length is 64.',
            expectedEmailError: '',
            expectedQuotaError: '',
        },
        {
            description: 'should render error if name is invalid',
            name: '^^',
            email: 'test@test.com',
            quota: '1',
            expectedNameError: 'Invalid account name.',
            expectedEmailError: '',
            expectedQuotaError: '',
        },
        {
            description: 'should render error if email is invalid',
            name: 'bart',
            email: 'invalid',
            quota: '1',
            expectedNameError: '',
            expectedEmailError: 'Invalid email address.',
            expectedQuotaError: '',
        },
        {
            description: 'should render error if email is too long (> 256)',
            name: 'bart',
            email: `${'b'.repeat(257)}@long.com`,
            quota: '1',
            expectedNameError: '',
            expectedEmailError: 'The length of the property is too long. The maximum length is 256.',
            expectedQuotaError: '',
        },
        {
            description: 'should render error if quota is invalid',
            name: 'bart',
            email: 'test@test.com',
            quota: '-1',
            expectedNameError: '',
            expectedEmailError: '',
            expectedQuotaError: 'Quota has to be a positive number. 0 means no quota.',
        },
    ];

    tests.forEach(t => {
        it(`Simulate click: ${t.description}`, () => {
            const { component } = reduxMount(<AccountCreate/>);
            component.find('input#name').simulate('change', { target: { value: t.name } });
            component.find('input#email').simulate('change', { target: { value: t.email } });
            component.find('input#quota').simulate('change', { target: { value: t.quota } });
            component.find('Button#create-account-btn').simulate('click');

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
            if (t.expectedQuotaError) {
                expect(component.find('ErrorInput#error-quota').text()).toContain(t.expectedQuotaError);
            } else {
                expect(component.find('ErrorInput#error-quota').text()).toBeFalsy();
            }
        });
    });

    //   * blur
    it('Simulate blur: should render no error if name is valid', () => {
        const { component } = reduxMount(<AccountCreate/>);
        component.find('input#name').simulate('change', { target: { value: 'ba' } });
        component.find('input#name').simulate('blur');

        expect(component.find('ErrorInput#error-name').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-email').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-quota').text()).toBeFalsy();
    });

    it('Simulate blur: should render error if name is too short', () => {
        const { component } = reduxMount(<AccountCreate/>);
        component.find('input#name').simulate('change', { target: { value: 'b' } });
        component.find('input#name').simulate('blur');

        expect(component.find('ErrorInput#error-name').text()).toContain('Account name should be at least 2 characters long.');
        expect(component.find('ErrorInput#error-email').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-quota').text()).toBeFalsy();
    });

    it('Simulate blur: should render error if name is invalid', () => {
        const { component } = reduxMount(<AccountCreate/>);
        component.find('input#name').simulate('change', { target: { value: '^^' } });
        component.find('input#name').simulate('blur');

        expect(component.find('ErrorInput#error-name').text()).toContain('Invalid account name.');
        expect(component.find('ErrorInput#error-email').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-quota').text()).toBeFalsy();
    });

    it('Simulate blur: should render error if name is too long (> 64)', () => {
        const { component } = reduxMount(<AccountCreate/>);
        component.find('input#name').simulate('change', { target: { value: 'b'.repeat(65) } });
        component.find('input#name').simulate('blur');

        expect(component.find('ErrorInput#error-name').text()).toContain('The length of the property is too long. The maximum length is 64.');
        expect(component.find('ErrorInput#error-email').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-quota').text()).toBeFalsy();
    });

    it('Simulate blur: should render no error if email is valid', () => {
        const { component } = reduxMount(<AccountCreate/>);
        component.find('input#email').simulate('change', { target: { value: 'test@test.com' } });
        component.find('input#email').simulate('blur');

        expect(component.find('ErrorInput#error-name').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-email').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-quota').text()).toBeFalsy();
    });

    it('Simulate blur: should render error if email is invalid', () => {
        const { component } = reduxMount(<AccountCreate/>);
        component.find('input#email').simulate('change', { target: { value: 'invalid' } });
        component.find('input#email').simulate('blur');

        expect(component.find('ErrorInput#error-name').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-email').text()).toContain('Invalid email address.');
        expect(component.find('ErrorInput#error-quota').text()).toBeFalsy();
    });

    it('Simulate blur: should render error if email is too long (> 256)', () => {
        const { component } = reduxMount(<AccountCreate/>);
        component.find('input#email').simulate('change', { target: { value: `${'b'.repeat(257)}@long.com` } });
        component.find('input#email').simulate('blur');

        expect(component.find('ErrorInput#error-name').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-email').text()).toContain('The length of the property is too long. The maximum length is 256.');
        expect(component.find('ErrorInput#error-quota').text()).toBeFalsy();
    });

    it('Simulate blur: should render no error if quota is valid', () => {
        const { component } = reduxMount(<AccountCreate/>);
        component.find('input#quota').simulate('change', { quota: { value: '1' } });
        component.find('input#quota').simulate('blur');

        expect(component.find('ErrorInput#error-quota').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-email').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-name').text()).toBeFalsy();
    });

    it('Simulate blur: should render error if quota is invalid', () => {
        const { component } = reduxMount(<AccountCreate/>);
        component.find('input#quota').simulate('change', { target: { value: '-1' } });
        component.find('input#quota').simulate('blur');

        expect(component.find('ErrorInput#error-name').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-email').text()).toBeFalsy();
        expect(component.find('ErrorInput#error-quota').text()).toContain('Quota has to be a positive number. 0 means no quota.');
    });

});
