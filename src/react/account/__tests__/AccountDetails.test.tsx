import router, { MemoryRouter } from 'react-router';
import AccountDetails from '../AccountDetails';
import React from 'react';
import { reduxRender } from '../../utils/testUtil';
import { screen } from '@testing-library/react';

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
    jest.spyOn(router, 'useParams').mockReturnValue({});
    jest.spyOn(router, 'useRouteMatch').mockReturnValue({
      url: '/',
    });
  });
  it('should render empty AccountDetails component if no account props', () => {
    const { component } = reduxRender(
      <MemoryRouter>
        <AccountDetails />
      </MemoryRouter>,
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
  it('should render AccountDetails component', () => {
    const { component } = reduxRender(
      <MemoryRouter>
        <AccountDetails account={account1} />
      </MemoryRouter>,
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
    expect(component.getByText('No key created')).toBeInTheDocument();
  });
});
