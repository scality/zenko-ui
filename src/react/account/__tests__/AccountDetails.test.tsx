import router, { MemoryRouter } from 'react-router';
import AccountDetails from '../AccountDetails';
import { reduxRender } from '../../utils/testUtil';

const account1 = {
  arn: 'arn1',
  canonicalId: 'canonicalId1',
  createDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
  email: 'test@email1.com',
  id: '1',
  quotaMax: 1,
  Name: 'bart',
};

const Wrapper = ({
  children,
  isStorageManager,
}: PropsWithChildren<{ isStorageManager: boolean }>) => {
  return (
    <MemoryRouter>
      <WrapperAsStorageManager isStorageManager={isStorageManager}>
        {children}
      </WrapperAsStorageManager>
    </MemoryRouter>
  );
};

describe('AccountDetails', () => {
  beforeEach(() => {
    jest.spyOn(router, 'useParams').mockReturnValue({});
    jest.spyOn(router, 'useRouteMatch').mockReturnValue({
      url: '/',
    });
  });
  it('should render empty AccountDetails component if no account props', () => {
    const { component } = reduxRender(
      <Wrapper isStorageManager={false}>
        <AccountDetails />
      </Wrapper>,
      {
        router: {
          location: {
            pathname: '/accounts/bart',
          },
        },
      },
    );
    expect(component.queryByRole('tablist')).toBeFalsy();
    expect(component.getByText('Account not found.')).toBeInTheDocument();
  });
  it('should render AccountDetails component without access keys for non storage manager users', () => {
    const { component } = reduxRender(
      <Wrapper isStorageManager={false}>
        <AccountDetails account={account1} />
      </Wrapper>,
      {
        router: {
          location: {
            pathname: '/accounts/bart',
          },
        },
      },
    );

    expect(component.getByRole('tablist')).toBeInTheDocument();
    // warning of account access key table
    expect(component.queryAllByText('No key created')).toHaveLength(0);
  });
  it('should render AccountDetails component without access keys for storage manager users', () => {
    //S
    const { component } = reduxRender(
      <Wrapper isStorageManager={true}>
        <AccountDetails account={account1} />
      </Wrapper>,
      {
        router: {
          location: {
            pathname: '/accounts/bart',
          },
        },
      },
    );

    //E+V
    expect(component.getByRole('tablist')).toBeInTheDocument();
    // warning of account access key table
    expect(component.getByText('No key created')).toBeInTheDocument();
  });
});
