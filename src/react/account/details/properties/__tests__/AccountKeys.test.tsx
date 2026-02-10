import { screen, waitFor } from '@testing-library/react';
import { accountAccessKeys } from '../../../../../js/mock/IAMClient';

import { mockOffsetSize, renderWithRouterMatch, testRender } from '../../../../utils/testUtil';
import AccountKeys from '../AccountKeys';
import * as useAccessKeysQueryModule from '../useAccessKeysQuery';

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

describe('AccountKeys', () => {
  const mockOnOpenKeyModal = jest.fn();

  beforeAll(() => {
    mockOffsetSize(200, 800);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render AccountKeys component', async () => {
    jest.spyOn(useAccessKeysQueryModule, 'useAccessKeysQuery').mockReturnValue({
      data: accountAccessKeys,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    renderWithRouterMatch(<AccountKeys account={account1} onOpenKeyModal={mockOnOpenKeyModal} />);

    await waitFor(() => {
      expect(screen.getByText('Access key ID')).toBeInTheDocument();
    });
    expect(screen.getByText('Created On')).toBeInTheDocument();

    accountAccessKeys.forEach((accessKey, i) => {
      expect(screen.getByText(accessKey.AccessKeyId)).toBeInTheDocument();
      expect(screen.getByText(i === 0 ? '2020-04-19 16:15' : '2021-04-19 16:15')).toBeInTheDocument();
    });
  });

  it('should render notification whenever there is at least 1 Root Access Key', async () => {
    const accessKey = accountAccessKeys[0];
    jest.spyOn(useAccessKeysQueryModule, 'useAccessKeysQuery').mockReturnValue({
      data: [accessKey],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    renderWithRouterMatch(<AccountKeys account={account1} onOpenKeyModal={mockOnOpenKeyModal} />);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Security Status: Root user Access keys give unrestricted access to account resources. It is a best practice to delete root Access keys and use IAM user access keys instead./i,
        ),
      ).toBeInTheDocument();
    });
  });

  it('should render Warning/Banner accordingly to number of Access Key', async () => {
    jest.spyOn(useAccessKeysQueryModule, 'useAccessKeysQuery').mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { component } = testRender(<AccountKeys account={account1} onOpenKeyModal={mockOnOpenKeyModal} />);

    await waitFor(() => {
      expect(component.getByText('No access keys found')).toBeInTheDocument();
    });

    const TableBody = component.queryByTestId('table-body');
    expect(TableBody).toBeFalsy();
    expect(component.queryByTestId('root-access-keys-banner')).not.toBeInTheDocument();
  });
});
