import * as T from '../../ui-elements/Table';
import AccountList from '../AccountList';
import React from 'react';
import { Warning } from '../../ui-elements/Warning';
import { formatDate } from '../../utils';
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

const account2 = {
    arn: 'arn2',
    canonicalId: 'canonicalId2',
    createDate: Date.parse('04 Jan 2006 05:12:00 GMT'),
    email: 'test@email2.com',
    id: '2',
    quotaMax: 2,
    userName: 'lisa',
};

const account3 = {
    arn: 'arn3',
    canonicalId: 'canonicalId3',
    createDate: Date.parse('04 Jan 2004 05:12:00 GMT'),
    email: 'test@email3.com',
    id: '3',
    quotaMax: 3,
    userName: 'homer',
};

describe('AccountList', () => {
    it('should render empty AccountList component if state is empty', () => {
        jest.spyOn(router, 'useParams').mockReturnValue({});
        const { component } = reduxMount(<AccountList/>, {
            configuration: {
                latest: {
                    users: [],
                },
            },
        });

        expect(component.find('div#account-list')).toHaveLength(0);
        expect(component.find(Warning)).toHaveLength(1);
        expect(component.find(Warning).text()).toContain('Let\'s start, create your first account.');
    });

    it('should render AccountList component with users sorted by creation date and homer row selected', () => {
        jest.spyOn(router, 'useParams').mockReturnValue({ accountName: 'homer' });
        const { component } = reduxMount(<AccountList/>, {
            configuration: {
                latest: {
                    users: [ account1, account2, account3 ],
                },
            },
        });
        expect(component.find('div#account-list')).toHaveLength(1);
        expect(component.find(Warning)).toHaveLength(0);

        const rows = component.find(T.Row);
        expect(rows).toHaveLength(3);

        const firstRow = rows.first();
        expect(firstRow.prop('isSelected')).toEqual(false);
        const firstRowColumns = firstRow.find(T.Cell).map(column => column.text());
        expect(firstRowColumns.length).toEqual(2);
        expect(firstRowColumns[0]).toEqual(account2.userName);
        expect(firstRowColumns[1]).toEqual(formatDate(new Date(account2.createDate)));

        const secondRow = rows.at(1);
        expect(secondRow.prop('isSelected')).toEqual(true);
        const secondRowColumns = secondRow.find(T.Cell).map(column => column.text());
        expect(secondRowColumns.length).toEqual(2);
        expect(secondRowColumns[0]).toEqual(account3.userName);
        expect(secondRowColumns[1]).toEqual(formatDate(new Date(account3.createDate)));

        const thirdRow = rows.last();
        expect(thirdRow.prop('isSelected')).toEqual(false);
        const thirdRowColumns = rows.last().find(T.Cell).map(column => column.text());
        expect(thirdRowColumns.length).toEqual(2);
        expect(thirdRowColumns[0]).toEqual(account1.userName);
        expect(thirdRowColumns[1]).toEqual(formatDate(new Date(account1.createDate)));
    });

});
