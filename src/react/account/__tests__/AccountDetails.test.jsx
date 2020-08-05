// NOTE: Babel generates properties with only get defined for re-exported functions.
// react-router-dom re-exports all of react-router's exports so
// an error is thrown when jest.spyOn is used to spy on the re-exported functions.
// Instead of importing react-router-dom (which re-exports useParams, useRouteMatch...),
// we import react-router where useParams, useRouteMatch are defined and use that module to create the spy.
import router, { MemoryRouter } from 'react-router';
import AccountDetails from '../AccountDetails';
import { CustomTabs } from '../../ui-elements/Tabs';
import React from 'react';
import { Warning } from '../../ui-elements/Warning';
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

describe('AccountDetails', () => {
    beforeEach(() => jest.spyOn(router, 'useRouteMatch').mockReturnValue({}));

    it('should render empty component if empty list and no accountName path parameter', () => {
        jest.spyOn(router, 'useParams').mockReturnValue({});
        const { component } = reduxMount(<MemoryRouter><AccountDetails/></MemoryRouter>, {
            router: {
                location: {
                    pathname: '',
                },
            },
        });

        expect(component.find(CustomTabs)).toHaveLength(0);
        expect(component.find(Warning)).toHaveLength(0);
    });

    it('should render Warning component if empty list but accountName path parameter', () => {
        jest.spyOn(router, 'useParams').mockReturnValue({ accountName: 'Idontexist' });
        const { component } = reduxMount(<MemoryRouter><AccountDetails/></MemoryRouter>, {
            router: {
                location: {
                    pathname: '',
                },
            },
        });

        expect(component.find(CustomTabs)).toHaveLength(0);
        expect(component.find(Warning)).toHaveLength(1);
    });

    it('should render Warning component if accountName path parameter not included in the list', () => {
        jest.spyOn(router, 'useParams').mockReturnValue({ accountName: 'Idontexist' });
        const { component } = reduxMount(<MemoryRouter><AccountDetails/></MemoryRouter>, {
            configuration: {
                latest: {
                    users: [ account1 ],
                },
            },
            router: {
                location: {
                    pathname: '',
                },
            },
        });

        expect(component.find(CustomTabs)).toHaveLength(0);
        expect(component.find(Warning)).toHaveLength(1);
    });

    it('should render AccountDetails if accountName path parameter included in the list', () => {
        jest.spyOn(router, 'useParams').mockReturnValue({ accountName: 'bart' });
        const { component } = reduxMount(<MemoryRouter><AccountDetails/></MemoryRouter>, {
            configuration: {
                latest: {
                    users: [ account1 ],
                },
            },
            router: {
                location: {
                    pathname: '',
                },
            },
        });

        expect(component.find(CustomTabs)).toHaveLength(1);
        expect(component.find(Warning)).toHaveLength(0);
    });

});
