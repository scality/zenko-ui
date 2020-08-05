import AccountContent, { EmptyState } from '../AccountContent';

// NOTE: Babel generates properties with only get defined for re-exported functions.
// react-router-dom re-exports all of react-router's exports so
// an error is thrown when jest.spyOn is used to spy on the re-exported functions.
// Instead of importing react-router-dom (which re-exports useParams, useRouteMatch...),
// we import react-router where useParams, useRouteMatch are defined and use that module to create the spy.
import router, { MemoryRouter } from 'react-router';
import AccountDetails from '../AccountDetails';
import AccountHead from '../AccountHead';
import React from 'react';
import { reduxMount } from '../../utils/test';

const account1 = {
    arn: 'arn1',
    canonicalId: 'canonicalId1',
    createDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
    email: 'test@email1.com',
    id: '1',
    quotaMax: 1,
    userName: 'bart',
};

describe('AccountContent', () => {
    it('should render empty state component if empty list', () => {
        jest.spyOn(router, 'useParams').mockReturnValue({});
        const { component } = reduxMount(<AccountContent/>);

        expect(component.find(AccountHead)).toHaveLength(0);
        expect(component.find(AccountDetails)).toHaveLength(0);

        const emptyState = component.find(EmptyState);
        expect(emptyState).toHaveLength(1);
    });

    it('should render AccountContent if accountName path parameter is included in the list', () => {
        jest.spyOn(router, 'useParams').mockReturnValue({ accountName: 'bart' });
        jest.spyOn(router, 'useRouteMatch').mockReturnValue({});
        const { component } = reduxMount(<MemoryRouter><AccountContent/></MemoryRouter>, {
            configuration: {
                latest: {
                    users: [ account1 ],
                },
            },
            router: {
                location: {
                    pathname: '/accounts/bart',
                },
            },
        });

        expect(component.find(AccountHead)).toHaveLength(1);
        expect(component.find(AccountDetails)).toHaveLength(1);
    });

});
