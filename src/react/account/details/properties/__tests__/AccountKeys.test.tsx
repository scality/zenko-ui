import { screen } from '@testing-library/react';
import { accountAccessKeys } from '../../../../../js/mock/IAMClient';

import {
  mockOffsetSize,
  reduxRender,
  renderWithRouterMatch,
} from '../../../../utils/testUtil';
import AccountKeys from '../AccountKeys';

const account1 = {
  arn: 'arn1',
  canonicalId: 'canonicalId1',
  CreationDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
  Roles: [],
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

    accountAccessKeys.forEach((accessKey, i) => {
      expect(screen.getByText(accessKey.AccessKeyId)).toBeInTheDocument();
      expect(
        screen.getByText(i === 0 ? '2020-04-19 16:15' : '2021-04-19 16:15'),
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
    expect(component.getByText('No access keys found')).toBeInTheDocument();
  });
});
