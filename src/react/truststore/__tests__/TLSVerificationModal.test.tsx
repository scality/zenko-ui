import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import TLSVerificationModal from '../TLSVerificationModal';
import {
  NewWrapper,
  mockOffsetSize,
  mockShellHooks,
} from '../../utils/testUtil';

// Mock Zenko CR endpoint URL
const TEST_URL = 'https://test-url';
const ZENKO_CR_URL = `${TEST_URL}/apis/zenko.io/v1alpha2/namespaces/zenko/zenkos/artesca-data`;

// Mock useDeployedMetalk8sInstances
jest.mock('../../next-architecture/ui/ConfigProvider', () => ({
  ...jest.requireActual('../../next-architecture/ui/ConfigProvider'),
  useDeployedMetalk8sInstances: jest.fn(() => [{ name: 'test-instance' }]),
}));

// Mock the mutation hook
const mockMutate = jest.fn();
const mockMutationResult = {
  mutate: mockMutate,
  isLoading: false,
  isIdle: true,
  isSuccess: false,
  isError: false,
  data: undefined,
  error: null,
  reset: jest.fn(),
  mutateAsync: jest.fn(),
  status: 'idle' as const,
  variables: undefined,
  context: undefined,
  failureCount: 0,
  failureReason: null,
  isPaused: false,
};

jest.mock('../../../js/mutations', () => ({
  ...jest.requireActual('../../../js/mutations'),
  useToggleTLSVerificationMutation: jest.fn(() => mockMutationResult),
}));

import { useToggleTLSVerificationMutation } from '../../../js/mutations';
const mockUseToggleTLSVerificationMutation =
  useToggleTLSVerificationMutation as jest.MockedFunction<
    typeof useToggleTLSVerificationMutation
  >;

describe('TLSVerificationModal', () => {
  const selectors = {
    modalTitle: (action: 'Skip' | 'Activate') =>
      screen.getByText(`${action} TLS Verification?`),
    cancelButton: () => screen.getByRole('button', { name: /Cancel/i }),
    confirmButton: () => screen.getByRole('button', { name: /Confirm/i }),
    confirmingButton: () =>
      screen.queryByRole('button', { name: /Updating\.\.\./i }),
    delayBanner: () =>
      screen.queryByText(/Expect some delay \(about 1 minute\)/i),
    skipWarningBanner: () =>
      screen.queryByText(/Skipping TLS Verification will allow ARTESCA/i),
    activateWarningBanner: () =>
      screen.getByText(/Make sure to import the certificates/i),
    checkbox: () =>
      screen.queryByRole('checkbox', {
        name: /I understand the consequences of activating TLS Verification/i,
      }),
  };

  const server = setupServer(
    rest.get(ZENKO_CR_URL, (req, res, ctx) => {
      return res(ctx.json({}));
    }),
    rest.patch(ZENKO_CR_URL, (req, res, ctx) => {
      return res(ctx.json({ status: 'Success' }));
    }),
  );

  const mockSetIsOpen = jest.fn();

  beforeAll(() => {
    mockShellHooks.useConfigRetriever.mockReturnValue({
      retrieveConfiguration: jest.fn(() => ({
        spec: {
          remoteEntryPath: '/remoteEntry.js',
          selfConfiguration: {
            url: TEST_URL,
          },
        },
      })),
    });

    server.listen({ onUnhandledRequest: 'warn' });
    mockOffsetSize(200, 800);
  });

  afterEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
    mockMutate.mockReset();
    mockSetIsOpen.mockReset();

    (mockUseToggleTLSVerificationMutation as jest.Mock).mockReturnValue(
      mockMutationResult,
    );
  });

  afterAll(() => {
    server.close();
  });

  describe('Basic Modal render', () => {
    it('should render Skip modal when TLS verification is active', () => {
      render(
        <TLSVerificationModal
          isOpen={true}
          setIsOpen={mockSetIsOpen}
          isTLSVerificationActive={true}
          hasEgress={true}
        />,
        { wrapper: NewWrapper() },
      );

      expect(selectors.modalTitle('Skip')).toBeInTheDocument();
      expect(selectors.delayBanner()).toBeInTheDocument();
      expect(selectors.skipWarningBanner()).toBeInTheDocument();
      expect(selectors.cancelButton()).toBeEnabled();
      expect(selectors.confirmButton()).toBeEnabled();
      expect(selectors.checkbox()).not.toBeInTheDocument();
    });

    it('should render Activate modal when TLS verification is skipped', () => {
      render(
        <TLSVerificationModal
          isOpen={true}
          setIsOpen={mockSetIsOpen}
          isTLSVerificationActive={false}
          hasEgress={true}
        />,
        { wrapper: NewWrapper() },
      );

      expect(selectors.modalTitle('Activate')).toBeInTheDocument();
      expect(selectors.delayBanner()).toBeInTheDocument();
      expect(selectors.activateWarningBanner()).toBeInTheDocument();
      expect(selectors.cancelButton()).toBeEnabled();
      expect(selectors.confirmButton()).toBeDisabled();
      expect(selectors.checkbox()).toBeInTheDocument();
    });

    it('should call setIsOpen(false) when clicking on cancel', async () => {
      render(
        <TLSVerificationModal
          isOpen={true}
          setIsOpen={mockSetIsOpen}
          isTLSVerificationActive={true}
          hasEgress={true}
        />,
        { wrapper: NewWrapper() },
      );

      expect(selectors.modalTitle('Skip')).toBeInTheDocument();

      await userEvent.click(selectors.cancelButton());

      expect(mockSetIsOpen).toHaveBeenCalledWith(false);
    });
  });

  describe('Mutation', () => {
    it('should call mutation with skipTLSVerify=true when confirming from active state', async () => {
      let capturedMutateArgs: any;
      let capturedHasEgress: boolean;
      (mockUseToggleTLSVerificationMutation as jest.Mock).mockImplementation(
        (hasEgress: boolean, options: any) => ({
          ...mockMutationResult,
          mutate: (args: any) => {
            capturedMutateArgs = args;
            capturedHasEgress = hasEgress;
            setTimeout(() => options?.onSuccess?.(), 0);
          },
        }),
      );

      render(
        <TLSVerificationModal
          isOpen={true}
          setIsOpen={mockSetIsOpen}
          isTLSVerificationActive={true}
          hasEgress={true}
        />,
        { wrapper: NewWrapper() },
      );

      await userEvent.click(selectors.confirmButton());

      await waitFor(() => {
        expect(capturedMutateArgs).toEqual({ skipTLSVerify: true });
        expect(capturedHasEgress).toBe(true);
      });
    });

    it('should call mutation with skipTLSVerify=false when confirming from skipped state', async () => {
      let capturedMutateArgs: any;

      (mockUseToggleTLSVerificationMutation as jest.Mock).mockImplementation(
        (hasEgress: boolean, options: any) => ({
          ...mockMutationResult,
          mutate: (args: any) => {
            capturedMutateArgs = args;
            setTimeout(() => options?.onSuccess?.(), 0);
          },
        }),
      );

      render(
        <TLSVerificationModal
          isOpen={true}
          setIsOpen={mockSetIsOpen}
          isTLSVerificationActive={false}
          hasEgress={true}
        />,
        { wrapper: NewWrapper() },
      );

      await userEvent.click(selectors.checkbox());

      await userEvent.click(selectors.confirmButton());

      await waitFor(() => {
        expect(capturedMutateArgs).toEqual({ skipTLSVerify: false });
      });
    });
  });

  describe('State rendering', () => {
    it('should close modal and display success toast when mutation succeeds', async () => {
      (mockUseToggleTLSVerificationMutation as jest.Mock).mockImplementation(
        (hasEgress: boolean, options: any) => ({
          ...mockMutationResult,
          mutate: () => {
            setTimeout(() => options?.onSuccess?.(), 0);
          },
        }),
      );

      render(
        <TLSVerificationModal
          isOpen={true}
          setIsOpen={mockSetIsOpen}
          isTLSVerificationActive={true}
          hasEgress={true}
        />,
        { wrapper: NewWrapper() },
      );

      await userEvent.click(selectors.confirmButton());

      // setIsOpen(false) should be called
      await waitFor(() => {
        expect(mockSetIsOpen).toHaveBeenCalledWith(false);
      });

      // Success toast should appear
      await waitFor(() => {
        expect(
          screen.getByText(/TLS verification updated successfully/i),
        ).toBeInTheDocument();
      });
    });

    it('should close modal and display error toast when mutation fails', async () => {
      (mockUseToggleTLSVerificationMutation as jest.Mock).mockImplementation(
        (hasEgress: boolean, options: any) => ({
          ...mockMutationResult,
          mutate: () => {
            setTimeout(() => options?.onError?.(), 0);
          },
        }),
      );

      render(
        <TLSVerificationModal
          isOpen={true}
          setIsOpen={mockSetIsOpen}
          isTLSVerificationActive={true}
          hasEgress={true}
        />,
        { wrapper: NewWrapper() },
      );

      await userEvent.click(selectors.confirmButton());

      // setIsOpen(false) should be called
      await waitFor(() => {
        expect(mockSetIsOpen).toHaveBeenCalledWith(false);
      });

      // Error toast should appear
      await waitFor(() => {
        expect(
          screen.getByText(
            /An error occurred while updating TLS verification/i,
          ),
        ).toBeInTheDocument();
      });
    });

    it('should display updating state during mutation: disabled buttons + updating label', () => {
      // Mock mutation to be in loading state
      (mockUseToggleTLSVerificationMutation as jest.Mock).mockReturnValue({
        ...mockMutationResult,
        isLoading: true,
      });

      render(
        <TLSVerificationModal
          isOpen={true}
          setIsOpen={mockSetIsOpen}
          isTLSVerificationActive={true}
          hasEgress={true}
        />,
        { wrapper: NewWrapper() },
      );

      // Should show "Updating..." button instead of "Confirm"
      expect(selectors.confirmingButton()).toBeInTheDocument();
      // Cancel button should be disabled
      expect(selectors.cancelButton()).toBeDisabled();
    });
  });
});
