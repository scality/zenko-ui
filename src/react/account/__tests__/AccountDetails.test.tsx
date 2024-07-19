import AccountDetails from '../AccountDetails';
import { renderWithRouterMatch } from '../../utils/testUtil';
import { useAuth } from '../../next-architecture/ui/AuthProvider';

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
      <AccountDetails account={account1} />,
      {
        route: '/accounts/bart',
        path: '/accounts/:accountName',
      },
    );

    expect(component.getByRole('tablist')).toBeInTheDocument();
    // warning of account access key table
    expect(component.queryAllByText('No access keys found')).toHaveLength(0);
  });

  it('should render AccountDetails component without access keys for storage manager users', () => {
    //S
    const component = renderWithRouterMatch(
      <AccountDetails account={account1} />,
      {
        route: '/accounts/bart',
        path: '/accounts/:accountName',
      },
    );

    //E+V
    expect(component.getByRole('tablist')).toBeInTheDocument();
    // warning of account access key table
    expect(component.getByText('No access keys found')).toBeInTheDocument();
  });
});
