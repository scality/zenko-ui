import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TLSVerificationUpdater from '../TLSVerificationUpdater';
import { ZenkoCR } from '../Truststore';
import {
  NewWrapper,
  mockOffsetSize,
  mockShellHooks,
} from '../../utils/testUtil';

// Mock useDeployedMetalk8sInstances
jest.mock('../../next-architecture/ui/ConfigProvider', () => ({
  ...jest.requireActual('../../next-architecture/ui/ConfigProvider'),
  useDeployedMetalk8sInstances: jest.fn(() => [{ name: 'test-instance' }]),
}));

// Mock the mutation hook (needed for modal)
jest.mock('../../../js/mutations', () => ({
  ...jest.requireActual('../../../js/mutations'),
  useToggleTLSVerificationMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isLoading: false,
  })),
}));

describe('TLSVerificationUpdater', () => {
  const selectors = {
    tlsVerificationLabel: () => screen.getByText('TLS Verification'),
    activeStatus: () => screen.getByText(/^Active$/i),
    skippedStatus: () => screen.getByText(/^Skipped$/i),
    loadingStatus: () => screen.getByText(/^Loading\.\.\.$/i),
    editButton: () => screen.getByRole('button', { name: /Open Modal/i }),
    modalTitle: (action: 'Skip' | 'Activate') =>
      screen.getByText(`${action} TLS Verification?`),
  };

  // Mock Zenko CR data with TLS verification active (has egress)
  const mockZenkoCRWithTLSActive: ZenkoCR = {
    metadata: { generation: 1 },
    spec: {
      egress: {
        skipTLSVerify: false,
        extraCACerts: [],
      },
    },
    status: {
      observedGeneration: 1,
      conditions: [
        { type: 'Available', status: 'True' },
        { type: 'DeploymentInProgress', status: 'False' },
        { type: 'DeploymentFailure', status: 'False' },
      ],
    },
  };

  // Mock Zenko CR data with TLS verification skipped
  const mockZenkoCRWithTLSSkipped: ZenkoCR = {
    metadata: { generation: 1 },
    spec: {
      egress: {
        skipTLSVerify: true,
        extraCACerts: [],
      },
    },
    status: {
      observedGeneration: 1,
      conditions: [
        { type: 'Available', status: 'True' },
        { type: 'DeploymentInProgress', status: 'False' },
      ],
    },
  };

  beforeAll(() => {
    mockShellHooks.useConfigRetriever.mockReturnValue({
      retrieveConfiguration: jest.fn(() => ({
        spec: {
          remoteEntryPath: '/remoteEntry.js',
          selfConfiguration: {
            url: 'https://test-url',
          },
        },
      })),
    });
    mockOffsetSize(200, 800);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Basic render
  // ============================================
  describe('Basic render', () => {
    it('should render when active: Active label + button enabled', () => {
      render(
        <TLSVerificationUpdater
          zenkoCR={mockZenkoCRWithTLSActive}
          isLoadingZenkoCR={false}
        />,
        { wrapper: NewWrapper() },
      );

      expect(selectors.tlsVerificationLabel()).toBeInTheDocument();
      expect(selectors.activeStatus()).toBeInTheDocument();
      expect(selectors.editButton()).toBeEnabled();
    });

    it('should render when skipped: Skipped label + button enabled', () => {
      render(
        <TLSVerificationUpdater
          zenkoCR={mockZenkoCRWithTLSSkipped}
          isLoadingZenkoCR={false}
        />,
        { wrapper: NewWrapper() },
      );

      expect(selectors.tlsVerificationLabel()).toBeInTheDocument();
      expect(selectors.skippedStatus()).toBeInTheDocument();
      expect(selectors.editButton()).toBeEnabled();
    });

    it('should render when loading ZenkoCR: Loading label + button disabled', () => {
      render(
        <TLSVerificationUpdater
          zenkoCR={mockZenkoCRWithTLSActive}
          isLoadingZenkoCR={true}
        />,
        { wrapper: NewWrapper() },
      );

      expect(selectors.tlsVerificationLabel()).toBeInTheDocument();
      expect(selectors.loadingStatus()).toBeInTheDocument();
      expect(selectors.editButton()).toBeDisabled();
    });
  });

  // ============================================
  // Modal opening
  // ============================================
  describe('Modal opening', () => {
    it('should open Skip modal when clicking edit button and TLS is active', async () => {
      render(
        <TLSVerificationUpdater
          zenkoCR={mockZenkoCRWithTLSActive}
          isLoadingZenkoCR={false}
        />,
        { wrapper: NewWrapper() },
      );

      await userEvent.click(selectors.editButton());

      await waitFor(() => {
        expect(selectors.modalTitle('Skip')).toBeInTheDocument();
      });
    });

    it('should open Activate modal when clicking edit button and TLS is skipped', async () => {
      render(
        <TLSVerificationUpdater
          zenkoCR={mockZenkoCRWithTLSSkipped}
          isLoadingZenkoCR={false}
        />,
        { wrapper: NewWrapper() },
      );

      await userEvent.click(selectors.editButton());

      await waitFor(() => {
        expect(selectors.modalTitle('Activate')).toBeInTheDocument();
      });
    });
  });
});
