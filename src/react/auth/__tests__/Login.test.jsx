import Login from '../Login';
import React from 'react';
import { reduxMount } from '../../utils/test';

describe('Login', () => {
    it('should render loader with redirect message if user is not authenticated', () => {
        const { component } = reduxMount(<Login/>, {
            router: {},
        });

        expect(component.find('Login').text()).toContain('Redirecting to the login in page');
    });

    it('should render "You are already logged in" message if user is already authenticated', () => {
        const { component } = reduxMount(<Login/>, {
            oidc: {
                user: { expired: false },
                isLoadingUser: false,
            },
            router: {},
        });

        expect(component.find('Login').text()).toContain('You are already logged in');
    });
});
