import { render, waitFor } from '@testing-library/react';
import {
  mockShellHooks,
  NewWrapper,
  renderWithRouterMatch,
} from '../../utils/testUtil';
import AccountDetails from '../AccountDetails';
import { debug } from 'jest-preview';

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

const useAuth = mockShellHooks.useAuth;

describe('AccountDetails', () => {
  beforeEach(() => {
    //@ts-expect-error fix this when you are working on it
    useAuth.mockImplementation(() => {
      return {
        userData: {
          id: 'xxx-yyy-zzzz-id',
          token: 'xxx-yyy-zzz-token',
          username: 'Renard ADMIN',
          email: 'renard.admin@scality.com',
          groups: ['StorageManager', 'user', 'PlatformAdmin'],
        },
      };
    });
  });

  it('should render empty AccountDetails component if no account props', () => {
    const component = renderWithRouterMatch(
      <AccountDetails account={undefined} />,
      {
        route: '/accounts/bart',
        path: '/accounts/:accountName',
      },
    );
    expect(component.queryByRole('tablist')).toBeFalsy();
    expect(component.getByText('Account not found.')).toBeInTheDocument();
  });

  it('should render AccountDetails component without access keys for non storage manager users', async () => {
    //@ts-expect-error fix this when you are working on it
    useAuth.mockImplementation(() => {
      return {
        userData: {
          id: 'xxx-yyy-zzzz-id',
          token: 'xxx-yyy-zzz-token',
          username: 'Renard ADMIN',
          email: 'renard.admin@scality.com',
          groups: ['user', 'PlatformAdmin'],
        },
      };
    });
    const component = render(<AccountDetails account={account1} />, {
      wrapper: NewWrapper(),
    });

    await waitFor(() => {
      expect(component.getByRole('tablist')).toBeInTheDocument();
    });
    // warning of account access key table
    expect(component.queryAllByText('No access keys found')).toHaveLength(0);
  });

  it('should render AccountDetails component without access keys for storage manager users', () => {
    //S
    const component = render(<AccountDetails account={account1} />, {
      wrapper: NewWrapper(),
    });

    //E+V
    expect(component.getByRole('tablist')).toBeInTheDocument();
    // warning of account access key table
    expect(component.queryAllByText('No access keys found')).toHaveLength(0);
  });
});
