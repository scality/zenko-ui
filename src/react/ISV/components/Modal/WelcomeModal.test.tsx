import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WelcomeModalInternal } from './WelcomeModal';
import {
  TEST_API_BASE_URL,
  Wrapper,
  expectElementNotToBeInDocument,
  mockOffsetSize,
  queryClient,
} from '../../../utils/testUtil';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { ACCOUNT_ID } from '../../../../js/mock/managementClientMSWHandlers';
import { VEEAM_DEFAULT_ACCOUNT_NAME } from '../../../ISV/constants';
import { useNextLogin } from '../../hooks/useNextLogin';
import { useAlerts } from '../../../next-architecture/ui/AlertProvider';
import { useIsVeeamVBROnly } from '../../hooks/useIsVeeamVBROnly';

jest.mock('../../hooks/useNextLogin', () => ({
  useNextLogin: jest.fn(),
}));
jest.mock('../../../next-architecture/ui/AlertProvider', () => ({
  useAlerts: jest.fn(),
}));
jest.mock('../../../next-architecture/domain/business/accounts');

jest.mock('./ISVModal', () => {
  const originalModule = jest.requireActual('./ISVModal');
  return {
    ...originalModule,
    ISVModalContent: ({ children, ...props }) => (
      <div data-testid="isv-modal-content" {...props}>
        {children}
      </div>
    ),
  };
});

// Add mock for useIsVeeamVBROnly - do this at the top with other mocks
jest.mock('../../hooks/useIsVeeamVBROnly', () => ({
  useIsVeeamVBROnly: jest.fn(),
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
const mockUseAlerts = useAlerts as jest.Mock;
const mockUseIsVeeamVBROnly = useIsVeeamVBROnly as jest.Mock;

describe('WelcomeModal', () => {
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
    welcomeModalVeeamOnly: () =>
      screen.getByRole('dialog', { name: /Welcome to Artesca Plus/i }),
    skipButton: () => screen.getByRole('button', { name: /Skip/i }),
  };
  const WelcomeModalComponent = (
    <Wrapper>
      <WelcomeModalInternal isFirstTimeLogin={true} />
    </Wrapper>
  );
  const renderWelcomeModal = () => {
    const { unmount, rerender } = render(WelcomeModalComponent);
    return { unmount, rerender };
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should not display if account has already been created', async () => {
    mockUseNextLogin.mockReturnValue({ isNextLogin: false });
    mockUseAlerts.mockReturnValue([]);
    //S
    renderWelcomeModal();
    //E+V
    await expectElementNotToBeInDocument(selectors.welcomeModal);
  });
  it('should render when there is no account created', async () => {
    mockUseNextLogin.mockReturnValue({ isNextLogin: true });
    mockUseAlerts.mockReturnValue([]);
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
    const { unmount } = renderWelcomeModal();

    //E
    await waitFor(() => {
      expect(selectors.welcomeModal()).toBeInTheDocument();
    });

    await act(async () => {
      await userEvent.click(selectors.skipButton());
    });
    //V
    await expectElementNotToBeInDocument(selectors.welcomeModal);
    //E
    unmount();

    await act(async () => {
      render(WelcomeModalComponent);
    });
    //V should see the modal again since there is no Veeam account created
    await waitFor(() => {
      expect(selectors.welcomeModal()).toBeInTheDocument();
    });
  });

  it('should display when there is no account and it is next login', async () => {
    mockUseNextLogin.mockReturnValue({ isNextLogin: true });
    mockUseAlerts.mockReturnValue([]);
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
    const { unmount } = renderWelcomeModal();
    //V
    await waitFor(() => {
      expect(selectors.welcomeModal()).toBeInTheDocument();
    });
    //E
    await act(async () => {
      await userEvent.click(selectors.skipButton());
    });
    unmount();

    await act(async () => {
      render(WelcomeModalComponent);
    });
    //V
    await expectElementNotToBeInDocument(selectors.welcomeModal);
  });

  it('should not display in case of trial license modal displayed', async () => {
    //S
    mockUseAlerts.mockReturnValue([
      {
        id: 'mock-trial-license-alert-id',
        labels: {
          alertname: 'TrialLicense',
          severity: 'info',
          selectors: [],
        },
      },
    ]);
    mockUseNextLogin.mockReturnValue({ isNextLogin: true });
    renderWelcomeModal();
    //E
    await expectElementNotToBeInDocument(selectors.welcomeModal);
  });

  it('should display in case of OVA and not first time login without any accounts', async () => {
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
    mockUseAlerts.mockReturnValue([
      {
        id: 'mock-trial-license-alert-id',
        labels: {
          alertname: 'TrialLicense',
          severity: 'info',
          selectors: [],
        },
      },
    ]);
    mockUseNextLogin.mockReturnValue({ isNextLogin: true });
    render(
      <Wrapper>
        <WelcomeModalInternal isFirstTimeLogin={false} />
      </Wrapper>,
    );
    //E+V
    await waitFor(() => {
      expect(selectors.welcomeModal()).toBeInTheDocument();
    });
  });

  it('should display in case of Veeam only', async () => {
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
    mockUseAlerts.mockReturnValue([
      {
        id: 'mock-trial-license-alert-id',
        labels: {
          alertname: 'TrialLicense',
          severity: 'info',
          selectors: [],
        },
      },
    ]);
    mockUseNextLogin.mockReturnValue({ isNextLogin: true });
    mockUseIsVeeamVBROnly.mockReturnValue(true);
    render(
      <Wrapper>
        <WelcomeModalInternal isFirstTimeLogin={false} />
      </Wrapper>,
    );
    //E+V
    await waitFor(() => {
      expect(selectors.welcomeModalVeeamOnly()).toBeInTheDocument();
    });
  });
});
