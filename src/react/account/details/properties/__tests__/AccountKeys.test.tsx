import Table, * as T from '../../../../ui-elements/Table';
import AccountKeys from '../AccountKeys';
import { HideMe } from '../../../../ui-elements/Utility';
import React from 'react';
import { Warning } from '../../../../ui-elements/Warning';
import { accountAccessKeys } from '../../../../../js/mock/IAMClient';
import { formatShortDate } from '../../../../utils';
import { reduxMount } from '../../../../utils/test';
const account1 = {
  arn: 'arn1',
  canonicalId: 'canonicalId1',
  createDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
  email: 'test@email1.com',
  id: '1',
  quotaMax: 1,
  Name: 'bart',
};
describe('AccountKeys', () => {
  it('should render AccountKeys component', () => {
    const { component } = reduxMount(<AccountKeys account={account1} />, {
      configuration: {
        latest: {
          users: [account1],
        },
      },
      account: {
        accessKeyList: accountAccessKeys,
      },
    });
    expect(component.find(Table)).toHaveLength(1);
    const rows = component.find(T.Row);
    expect(rows).toHaveLength(accountAccessKeys.length);
    // Check if accessKeys are sorted by creation date (most recent being on the top)
    const firstRow = rows.first();
    const firstColumns = firstRow.find(T.Cell).map((column) => column.text());
    expect(firstColumns.length).toEqual(3);
    expect(firstColumns[0]).toEqual(accountAccessKeys[1].AccessKeyId);
    expect(firstColumns[1]).toEqual(
      formatShortDate(new Date(accountAccessKeys[1].CreateDate)),
    );
    const secondRow = rows.at(1);
    const secondColumns = secondRow.find(T.Cell).map((column) => column.text());
    expect(secondColumns.length).toEqual(3);
    expect(secondColumns[0]).toEqual(accountAccessKeys[0].AccessKeyId);
    expect(secondColumns[1]).toEqual(
      formatShortDate(new Date(accountAccessKeys[0].CreateDate)),
    );
  });
  it('should render notification whenever there is at least 1 Root Access Key', () => {
    const accessKey = accountAccessKeys[0];
    const { component } = reduxMount(<AccountKeys account={account1} />, {
      configuration: {
        latest: {
          users: [account1],
        },
      },
      account: {
        accessKeyList: [accessKey], // only one key
      },
    });
    expect(component.find(Table)).toHaveLength(1);
    const rows = component.find(T.Row);
    expect(rows).toHaveLength(1);
    const row = rows.first();
    const columns = row.find(T.Cell).map((column) => column.text());
    expect(columns.length).toEqual(3);
    expect(columns[0]).toEqual(accessKey.AccessKeyId);
    expect(columns[1]).toEqual(formatShortDate(new Date(accessKey.CreateDate)));
    // Check if there is the notification
    expect(component.find(HideMe).prop('isHidden')).toBeFalsy();
  });
  it('should render Warning/Banner accordingly to number of Access Key', () => {
    const { component } = reduxMount(<AccountKeys account={account1} />, {
      configuration: {
        latest: {
          users: [account1],
        },
      },
      account: {
        accessKeyList: [],
      },
    });
    expect(component.find(Table)).toHaveLength(1);
    const rows = component.find(T.Row);
    expect(rows).toHaveLength(0);
    // Check if there is the notification
    expect(component.find(HideMe).prop('isHidden')).toBeTruthy();
    // Check if there is the Warning in the table
    expect(component.find(Warning)).toHaveLength(1);
  });
});
