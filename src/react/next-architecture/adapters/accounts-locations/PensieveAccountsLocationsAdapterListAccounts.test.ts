import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  getConfigOverlay,
  USERS,
} from '../../../../js/mock/managementClientMSWHandlers';
import { PensieveAccountsAdapter } from './PensieveAccountsLocationsAdapter';

const baseUrl = 'http://localhost:8080';
const instanceId = 'test-instance-id';
const server = setupServer(getConfigOverlay(baseUrl, instanceId));

describe('PensieveAccountsAdapter - listAccounts', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
  });
  it('should return all the accounts from pensieve api', async () => {
    //S
    const token = 'test-token';
    const SUT = new PensieveAccountsAdapter(baseUrl, instanceId, token);
    //E
    const result = await SUT.listAccounts();
    //V
    const EXPECTED_USERS = USERS.map((user) => {
      return {
        id: user.id,
        name: user.userName,
        canonicalId: user.canonicalId,
        creationDate: user.createDate,
      };
    });
    expect(result).toStrictEqual(EXPECTED_USERS);
  });
  it('should reject when pensieve api return an error', async () => {
    //S
    const token = 'test-token';
    const SUT = new PensieveAccountsAdapter(baseUrl, instanceId, token);
    server.use(
      rest.get(
        `${baseUrl}/api/v1/config/overlay/view/${instanceId}`,
        (req, res, ctx) => res(ctx.status(500)),
      ),
    );
    //E+V
    await expect(SUT.listAccounts()).rejects.toBeDefined();
  });
});
