import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { INSTANCE_ID } from '../../../js/mock/managementClientMSWHandlers';
import { TEST_API_BASE_URL } from '../../utils/testUtil';
import type { ToolContext } from '../types';
import { createAccountTool } from './createAccountTool';

const ACCOUNT_NAME = 'new-account';
const ACCOUNT_EMAIL = 'new-account@test.local';

const token = `header.${btoa(JSON.stringify({ instanceIds: [INSTANCE_ID] }))}.signature`;

const context: ToolContext = {
  getToken: () => Promise.resolve(token),
  userData: undefined,
  selfConfiguration: {
    managementEndpoint: TEST_API_BASE_URL,
    iamEndpoint: TEST_API_BASE_URL,
    stsEndpoint: TEST_API_BASE_URL,
    zenkoEndpoint: TEST_API_BASE_URL,
  },
};

let createdUser: { userName: string; email: string } | null = null;

const server = setupServer(
  rest.post(`${TEST_API_BASE_URL}/api/v1/config/${INSTANCE_ID}/user`, (req, res, ctx) => {
    createdUser = req.body as { userName: string; email: string };
    return res(ctx.status(201), ctx.json({ id: 'new-account-id', ...createdUser }));
  }),
);

describe('createAccountTool', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => {
    server.resetHandlers();
    createdUser = null;
  });
  afterAll(() => {
    server.close();
  });

  it('should trim the account name and email before creating the account', async () => {
    await createAccountTool.execute({ name: `  ${ACCOUNT_NAME}  `, email: `  ${ACCOUNT_EMAIL}  `, context }, undefined);

    expect(createdUser).toEqual({ userName: ACCOUNT_NAME, email: ACCOUNT_EMAIL });
  });
});
