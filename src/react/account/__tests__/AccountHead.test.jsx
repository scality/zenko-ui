import { Head, HeadCenter, HeadLeft, HeadRight, HeadTitle } from '../../ui-elements/ListLayout';
import AccountHead from '../AccountHead';
import React from 'react';
import { reduxMount } from '../../utils/test';
import router from 'react-router';

describe('AccountHead', () => {
    it('should render empty AccountHead component if state is empty', () => {
        jest.spyOn(router, 'useParams').mockReturnValue({});
        const { component } = reduxMount(<AccountHead/>);

        expect(component.find(Head)).toHaveLength(1);
        expect(component.find(HeadCenter)).toHaveLength(0);
        expect(component.find(HeadLeft)).toHaveLength(0);
        expect(component.find(HeadRight)).toHaveLength(0);
    });

    it('should render AccountHead component', () => {
        jest.spyOn(router, 'useParams').mockReturnValue({ accountName: 'bart' });
        const { component } = reduxMount(<AccountHead/>);

        expect(component.find(Head)).toHaveLength(1);
        expect(component.find(HeadTitle).text()).toContain('bart');
    });
});
