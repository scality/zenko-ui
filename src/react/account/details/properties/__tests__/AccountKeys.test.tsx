import AccountKeys from '../AccountKeys';
import React from 'react';
import { accountAccessKeys } from '../../../../../js/mock/IAMClient';
import { formatShortDate } from '../../../../utils';
import {
  mockOffsetSize,
  reduxRender,
  renderWithRouterMatch,
} from '../../../../utils/testUtil';
import { screen } from '@testing-library/react';
import { debug } from 'jest-preview';

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
    renderWithRouterMatch(<AccountKeys account={account1} />, undefined, {
      configuration: {
        latest: {
          users: [account1],
        },
      },
      account: {
        accessKeyList: accountAccessKeys,
      },
    });

    expect(screen.getByText('Access key ID')).toBeInTheDocument();
    expect(screen.getByText('Created On')).toBeInTheDocument();

    accountAccessKeys.forEach((accessKey) => {
      expect(screen.getByText(accessKey.AccessKeyId)).toBeInTheDocument();
      expect(
        screen.getByText(formatShortDate(new Date(accessKey.CreateDate))),
      ).toBeInTheDocument();
    });
  });

  it('should render notification whenever there is at least 1 Root Access Key', () => {
    const accessKey = accountAccessKeys[0];
    renderWithRouterMatch(<AccountKeys account={account1} />, undefined, {
      configuration: {
        latest: {
          users: [account1],
        },
      },
      account: {
        accessKeyList: [accessKey], // only one key
      },
    });

    expect(
      screen.getByText(
        /Security Status: Root user Access keys give unrestricted access to account resources. It is a best practice to delete root Access keys and use IAM user access keys instead./i,
      ),
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
