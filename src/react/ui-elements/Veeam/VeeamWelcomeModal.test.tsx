import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VeeamWelcomeModalInternal } from './VeeamWelcomeModal';
import { QueryClientProvider } from 'react-query';
import {
  TEST_API_BASE_URL,
  expectElementNotToBeInDocument,
  mockOffsetSize,
  queryClient,
} from '../../utils/testUtil';
import { InternalRouter } from '../../FederableApp';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { ACCOUNT_ID } from '../../../js/mock/managementClientMSWHandlers';
import { VEEAM_DEFAULT_ACCOUNT_NAME } from './VeeamConstants';
import { useNextLogin } from './useNextLogin';

jest.mock('./useNextLogin', () => ({
  useNextLogin: jest.fn(),
}));

const TEST_ACCOUNT_CREATION_DATE = '2022-03-18T12:51:44Z';
const server = setupServer(
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
    return res(
      ctx.json({
        IsTruncated: false,
        Accounts: [
          {
            Name: VEEAM_DEFAULT_ACCOUNT_NAME,
            CreationDate: TEST_ACCOUNT_CREATION_DATE,
            Roles: [
              {
                Name: 'storage-manager-role',
                Arn: `arn:aws:iam::${ACCOUNT_ID}:role/scality-internal/storage-manager-role`,
              },
            ],
          },
        ],
      }),
    );
  }),
);

const mockUseNextLogin = useNextLogin as jest.Mock;

describe('VeeamWelcomeModal', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
    mockOffsetSize(200, 1000);
  });
  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
  });
  afterAll(() => server.close());
  const selectors = {
    welcomeModal: () =>
      screen.getByRole('dialog', { name: /Welcome to ARTESCA/i }),
    skipButton: () => screen.getByRole('button', { name: /Skip/i }),
  };
  const VeeamWelcomeModalComponent = (
    <QueryClientProvider client={queryClient}>
      <InternalRouter>
        <VeeamWelcomeModalInternal />
      </InternalRouter>
    </QueryClientProvider>
  );
  const renderVeeamWelcomeModal = () => {
    const { unmount, rerender } = render(VeeamWelcomeModalComponent);
    return { unmount, rerender };
  };
  it('should not display if Veeam account has already created', async () => {
    mockUseNextLogin.mockReturnValue({ isNextLogin: false });
    //S
    renderVeeamWelcomeModal();
    //E+V
    await expectElementNotToBeInDocument(selectors.welcomeModal);
  });
  it('should render when there is no Veeam account created', async () => {
    mockUseNextLogin.mockReturnValue({ isNextLogin: true });
    //S
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (_, res, ctx) => {
        return res(
          ctx.json({
            IsTruncated: false,
            Accounts: [],
          }),
        );
      }),
    );
    const { unmount, rerender } = renderVeeamWelcomeModal();
    //E
    await waitFor(() => {
      expect(selectors.welcomeModal()).toBeInTheDocument();
    });
    await userEvent.click(selectors.skipButton());
    //V
    await expectElementNotToBeInDocument(selectors.welcomeModal);
    //E
    unmount();
    rerender(VeeamWelcomeModalComponent);
    //V should see the modal again since there is no Veeam account created
    await waitFor(() => {
      expect(selectors.welcomeModal()).toBeInTheDocument();
    });
  });
  it('should display when there is no account and it is next login', async () => {
    mockUseNextLogin.mockReturnValue({ isNextLogin: true });
    //S
    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (_, res, ctx) => {
        return res(
          ctx.json({
            IsTruncated: false,
            Accounts: [],
          }),
        );
      }),
    );
    const { unmount, rerender } = renderVeeamWelcomeModal();
    //V
    await waitFor(() => {
      expect(selectors.welcomeModal()).toBeInTheDocument();
    });
    //E
    await userEvent.click(selectors.skipButton());
    unmount();
    rerender(VeeamWelcomeModalComponent);
    //V
    await expectElementNotToBeInDocument(selectors.welcomeModal);
  });
});
