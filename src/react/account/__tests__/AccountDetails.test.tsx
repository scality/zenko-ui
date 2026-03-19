import { render, waitFor } from '@testing-library/react';
import { mockShellHooks, NewWrapper, renderWithRouterMatch } from '../../utils/testUtil';
import AccountDetails from '../AccountDetails';

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
    useAuth.mockImplementation(() => {
      return {
        userData: {
          token: 'xxx-yyy-zzz-token',
          original: {
            id_token: 'idtoken',
            session_state: 'xxx-yyy-zzzz-id',
            access_token: 'xxx-yyy-zzz-token',
            profile: {
              sub: 'xxx-yyy-zzzz-id',
              instanceIds: ['instance-id'],
              name: 'Renard ADMIN',
              email: 'renard.admin@scality.com',
            },
            expires_at: Date.now() / 1000 + 3600,
          },
          groups: ['StorageManager', 'user', 'PlatformAdmin'],
        },
        getToken: async (): Promise<string> => {
          return 'xxx-yyy-zzz-token';
        },
      };
    });
  });

  it('should render empty AccountDetails component if no account props', () => {
    const component = renderWithRouterMatch(<AccountDetails account={undefined} />, {
      route: '/accounts/bart',
      path: '/accounts/:accountName',
    });
    expect(component.queryByRole('tablist')).toBeFalsy();
    waitFor(() => {
      expect(component.getByText('Account not found.')).toBeInTheDocument();
    });
  });

  it('should render AccountDetails component without access keys for non storage manager users', async () => {
    useAuth.mockImplementation(() => {
      return {
        userData: {
          token: 'xxx-yyy-zzz-token',
          original: {
            id_token: 'idtoken',
            session_state: 'xxx-yyy-zzzz-id',
            access_token: 'xxx-yyy-zzz-token',
            profile: {
              sub: 'xxx-yyy-zzzz-id',
              instanceIds: ['instance-id'],
              name: 'Renard ADMIN',
              email: 'renard.admin@scality.com',
            },
            expires_at: Date.now() / 1000 + 3600,
          },
          groups: ['user', 'PlatformAdmin'],
        },
        getToken: async (): Promise<string> => {
          return 'xxx-yyy-zzz-token';
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
