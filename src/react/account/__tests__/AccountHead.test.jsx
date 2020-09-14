import { HeadCenter, HeadRight, HeadTitle } from '../../ui-elements/ListLayout';
import AccountHead from '../AccountHead';
import { Button } from '@scality/core-ui';
import React from 'react';
import { reduxMount } from '../../utils/test';
import router from 'react-router';

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
    it('should render AccountHead component with no delete button if no account props', () => {
        const accountName = 'newAccount';
        jest.spyOn(router, 'useParams').mockReturnValue({ accountName });
        const { component } = reduxMount(<AccountHead />);

        expect(component.find(HeadCenter)).toHaveLength(1);
        expect(component.find(HeadTitle).text()).toContain(accountName);
        expect(component.find(HeadCenter)).toHaveLength(1);

        const button = component.find(HeadRight).find(Button);
        expect(button).toHaveLength(0);
    });

    it('should render AccountHead component', () => {
        jest.spyOn(router, 'useParams').mockReturnValue({ accountName: account1.userName });
        const { component } = reduxMount(<AccountHead account={account1}/>);

        expect(component.find(HeadCenter)).toHaveLength(1);
        expect(component.find(HeadTitle).text()).toContain(account1.userName);
        expect(component.find(HeadCenter)).toHaveLength(1);

        const button = component.find(HeadRight).find(Button);
        expect(button).toHaveLength(1);
        expect(button.text()).toContain('Delete Account');
    });
});
