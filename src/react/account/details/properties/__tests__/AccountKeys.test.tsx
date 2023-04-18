import AccountKeys from '../AccountKeys';
import React from 'react';
import { accountAccessKeys } from '../../../../../js/mock/IAMClient';
import { formatShortDate } from '../../../../utils';
import { mockOffsetSize, reduxRender } from '../../../../utils/testUtil';

const account1 = {
  arn: 'arn1',
  canonicalId: 'canonicalId1',
  createDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
  email: 'test@email1.com',
  id: '1',
  quotaMax: 1,
  Name: 'bart',
};

function flattenTableRow(row: Element) {
  return Array.from(row.getElementsByClassName('td')).map(
    (cell) => cell.textContent,
  );
}

describe('AccountKeys', () => {
  beforeAll(() => {
    mockOffsetSize(200, 800);
  });

  it('should render AccountKeys component', () => {
    const { component } = reduxRender(<AccountKeys account={account1} />, {
      configuration: {
        latest: {
          users: [account1],
        },
      },
      account: {
        accessKeyList: accountAccessKeys,
      },
    });

    const rows = component
      .getAllByRole('rowgroup')[1]
      .getElementsByClassName('tr');
    expect(rows).toHaveLength(accountAccessKeys.length);
    // Check if accessKeys are sorted by creation date (most recent being on the top)
    const firstRowCells = flattenTableRow(rows[0]);
    expect(firstRowCells.length).toEqual(3);
    expect(firstRowCells[0]).toEqual(accountAccessKeys[1].AccessKeyId);
    expect(firstRowCells[1]).toEqual(
      formatShortDate(new Date(accountAccessKeys[1].CreateDate)),
    );

    const secondRowCells = flattenTableRow(rows[1]);
    expect(secondRowCells.length).toEqual(3);
    expect(secondRowCells[0]).toEqual(accountAccessKeys[0].AccessKeyId);
    expect(secondRowCells[1]).toEqual(
      formatShortDate(new Date(accountAccessKeys[0].CreateDate)),
    );
  });
  it('should render notification whenever there is at least 1 Root Access Key', () => {
    const accessKey = accountAccessKeys[0];
    const { component } = reduxRender(<AccountKeys account={account1} />, {
      configuration: {
        latest: {
          users: [account1],
        },
      },
      account: {
        accessKeyList: [accessKey], // only one key
      },
    });

    const rows = component
      .getAllByRole('rowgroup')[1]
      .getElementsByClassName('tr');
    expect(rows).toHaveLength(1);

    const cells = flattenTableRow(rows[0]);
    expect(cells.length).toEqual(3);
    expect(cells[0]).toEqual(accessKey.AccessKeyId);
    expect(cells[1]).toEqual(formatShortDate(new Date(accessKey.CreateDate)));
    // Check if there is the notification
    expect(
      component.getByTestId('root-access-keys-banner'),
    ).toBeInTheDocument();
  });

  it('should render Warning/Banner accordingly to number of Access Key', () => {
    const { component } = reduxRender(<AccountKeys account={account1} />, {
      configuration: {
        latest: {
          users: [account1],
        },
      },
      account: {
        accessKeyList: [],
      },
    });

    const TableBody = component.queryByTestId('table-body');

    expect(TableBody).toBeFalsy();
    // Check if there is the notification
    expect(
      component.queryByTestId('root-access-keys-banner'),
    ).not.toBeInTheDocument();
    // Check if there is the Warning in the table
    expect(component.getByText('No key created')).toBeInTheDocument();
  });
});
