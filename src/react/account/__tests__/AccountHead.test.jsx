import { Head, HeadCenter, HeadLeft, HeadRight, HeadTitle } from '../../ui-elements/ListLayout';
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

describe('AccountHead', () => {
    it('should render empty AccountHead component if state is empty', () => {
        const { component } = reduxMount(<AccountHead/>);

        expect(component.find(Head)).toHaveLength(1);
        expect(component.find(HeadCenter)).toHaveLength(0);
        expect(component.find(HeadLeft)).toHaveLength(0);
        expect(component.find(HeadRight)).toHaveLength(0);
    });

    it('should render AccountHead component', () => {
        const { component } = reduxMount(<AccountHead/>, {
            account: {
                display: account1,
            },
        });

        expect(component.find(Head)).toHaveLength(1);
        expect(component.find(HeadTitle).text()).toContain('bart');
    });
});
