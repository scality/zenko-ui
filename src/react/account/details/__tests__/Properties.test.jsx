import * as T from '../../../ui-elements/TableKeyValue';
import { Button } from '@scality/core-ui';
import Properties from '../Properties';
import React from 'react';
import Table from '../../../ui-elements/TableKeyValue';
import { formatDate } from '../../../utils';
import { reduxMount } from '../../../utils/test';


const account1 = {
    arn: 'arn1',
    canonicalId: 'canonicalId1',
    createDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
    email: 'test@email1.com',
    id: '1',
    quotaMax: 1,
    userName: 'bart',
};

function testRow(rowWrapper, { key, value, extraCellComponent }) {
    expect(rowWrapper.find(T.Key).text()).toContain(key);
    expect(rowWrapper.find(T.Value).text()).toContain(value);
    if (extraCellComponent) {
        expect(rowWrapper.find(T.ExtraCell).find(extraCellComponent)).toHaveLength(1);
    } else {
        expect(rowWrapper.find(T.ExtraCell)).toHaveLength(0);
    }
}

describe('Properties', () => {
    it('should render Properties component', () => {
        const { component } = reduxMount(<Properties account={account1} />);

        const button = component.find(Button);
        expect(button).toHaveLength(1);
        expect(button.text()).toContain('Delete Account');

        expect(component.find(Table)).toHaveLength(1);

        const rows = component.find(T.Row);
        expect(rows).toHaveLength(5);

        const firstRow = rows.first();
        testRow(firstRow, { key: 'Account ID', value: account1.id, extraCellComponent: 'Clipboard' });

        const secondRow = rows.at(1);
        testRow(secondRow, { key: 'Name', value: account1.userName, extraCellComponent: 'Clipboard' });

        const thirdRow = rows.at(2);
        testRow(thirdRow, { key: 'Creation Date', value: formatDate(new Date(account1.createDate)) });

        const fifthRow = rows.at(3);
        testRow(fifthRow, { key: 'Root User Email', value: account1.email, extraCellComponent: 'Clipboard' });

        const sixthRow = rows.at(4);
        testRow(sixthRow, { key: 'Root User ARN', value: account1.arn, extraCellComponent: 'Clipboard' });
    });

});
