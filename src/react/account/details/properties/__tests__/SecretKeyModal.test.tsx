import Table, * as T from '../../../../ui-elements/TableKeyValue';
import { reduxMount, testTableRow } from '../../../../utils/testUtil';
import React from 'react';
import SecretKeyModal from '../SecretKeyModal';
const account = {
  arn: 'arn1',
  canonicalId: 'canonicalId1',
  createDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
  email: 'test@email1.com',
  id: '1',
  quotaMax: 1,
  Name: 'bart',
};
const accountKey = {
  userName: 'bart',
  accessKey: 'ak1',
  secretKey: 'sk1',
};
const hiddenValue = '*********';

function testRow(rowWrapper, { key, value, extraCellComponent }) {
  testTableRow(T, rowWrapper, {
    key,
    value,
    extraCellComponent,
  });
}

describe('SecretKeyModal', () => {
  it('should render SecretKeyModal', async () => {
    const { component } = reduxMount(<SecretKeyModal account={account} />, {
      uiAccounts: {
        showKeyCreate: true,
      },
    });
    expect(component.find(SecretKeyModal).isEmptyRender()).toBe(false);
  });
  it('should not render SecretKeyModal if closed', async () => {
    const { component } = reduxMount(<SecretKeyModal account={account} />);
    expect(component.find(SecretKeyModal).isEmptyRender()).toBe(true);
  });
  it('should render SecretKeyModal component with key informations', () => {
    const { component } = reduxMount(<SecretKeyModal account={account} />, {
      uiAccounts: {
        showKeyCreate: true,
      },
      secrets: {
        accountKey,
      },
    });
    expect(component.find(Table)).toHaveLength(1);
    const rows = component.find(T.Row);
    expect(rows).toHaveLength(3);
    const firstRow = rows.first();
    testRow(firstRow, {
      key: 'Account name',
      value: accountKey.userName,
    });
    const secondRow = rows.at(1);
    testRow(secondRow, {
      key: 'Access key ID',
      value: accountKey.accessKey,
      extraCellComponent: 'Clipboard',
    });
    const thirdRow = rows.at(2);
    testRow(thirdRow, {
      key: 'Secret Access key',
      value: hiddenValue,
      extraCellComponent: 'Clipboard',
    });
  });
});
