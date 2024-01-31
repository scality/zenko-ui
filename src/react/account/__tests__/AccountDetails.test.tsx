import AccountDetails from '../AccountDetails';
import { renderWithRouterMatch } from '../../utils/testUtil';
import { _AuthContext, useAuth } from '../../next-architecture/ui/AuthProvider';

const account1 = {
  arn: 'arn1',
  canonicalId: 'canonicalId1',
  createDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
  email: 'test@email1.com',
  id: '1',
  quotaMax: 1,
  Name: 'bart',
};

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

  it('should render AccountDetails component without access keys for non storage manager users', () => {
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
    const component = renderWithRouterMatch(
      //@ts-expect-error fix this when you are working on it
      <AccountDetails account={account1} />,
      {
        route: '/accounts/bart',
        path: '/accounts/:accountName',
      },
    );

    expect(component.getByRole('tablist')).toBeInTheDocument();
    // warning of account access key table
    expect(component.queryAllByText('No key created')).toHaveLength(0);
  });

  it('should render AccountDetails component without access keys for storage manager users', () => {
    //S
    const component = renderWithRouterMatch(
      //@ts-expect-error fix this when you are working on it
      <AccountDetails account={account1} />,
      {
        route: '/accounts/bart',
        path: '/accounts/:accountName',
      },
    );

    //E+V
    expect(component.getByRole('tablist')).toBeInTheDocument();
    // warning of account access key table
    expect(component.getByText('No key created')).toBeInTheDocument();
  });
});
