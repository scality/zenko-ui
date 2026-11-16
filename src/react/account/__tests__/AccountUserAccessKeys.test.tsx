import { screen, within } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import IAMClient from '../../../js/IAMClient';
import * as IAMProviderModule from '../../IAMProvider';
import { mockOffsetSize, TEST_API_BASE_URL, testRender } from '../../utils/testUtil';
import AccountUserAccessKeys from '../AccountUserAccessKeys';

// testRender's providers call STS (GetRolesForWebIdentity) on mount; these tests do not need its answer.
const server = setupServer(rest.post(`${TEST_API_BASE_URL}/`, (_req, res, ctx) => res(ctx.status(500, 'error'))));

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 100);
});
afterEach(() => {
  server.resetHandlers();
  jest.restoreAllMocks();
});
afterAll(() => server.close());

describe('AccountUserAccessKeys', () => {
  it('shows the loader in the table while the IAM client is not logged in yet', () => {
    jest.spyOn(IAMProviderModule, 'useIAMClient').mockReturnValue(new IAMClient(TEST_API_BASE_URL));

    testRender(<AccountUserAccessKeys />);

    expect(within(screen.getByRole('grid')).getByText('Loading access keys...')).toBeInTheDocument();
  });
  it('shows the error in the table when listing the access keys fails', async () => {
    server.use(rest.post(`${TEST_API_BASE_URL}/`, (_req, res, ctx) => res(ctx.status(500, 'error'))));

    testRender(<AccountUserAccessKeys />);

    expect(
      await within(screen.getByRole('grid')).findByText(/an error occurred while loading the access keys/i, undefined, {
        timeout: 5000,
      }),
    ).toBeInTheDocument();
  });
});
