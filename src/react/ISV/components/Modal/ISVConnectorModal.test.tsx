import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ShellAlerts, ShellHooks } from 'shell/compiled-types/src/hooks/useShellHooks';
import { mockOffsetSize, mockShellAlerts, mockShellHooks } from '../../../utils/testUtil';
import ISVConnectorModal from './ISVConnectorModal';

// Variables prefixed with 'mock' are accessible inside hoisted jest.mock() factories
const mockOpenLink = jest.fn();
let mockDeployedApps: { kind: string; appHistoryBasePath: string }[] = [
  { kind: 'zenko-ui', appHistoryBasePath: '/data' },
];
let mockSetSelectedISV: ((isv: unknown) => void) | null = null;

// Replace Modal with a non-portal version so React's event delegation works in tests
jest.mock('@scality/core-ui', () => {
  const actual = jest.requireActual('@scality/core-ui');
  return {
    ...actual,
    Modal: ({
      isOpen,
      children,
      footer,
    }: {
      isOpen: boolean;
      children: React.ReactNode;
      footer?: React.ReactNode;
    }) => (isOpen ? <div role="dialog">{children}{footer}</div> : null),
  };
});

jest.mock('./ISVModal', () => ({
  ISVModalContent: ({ setSelectedISV }: { setSelectedISV: (isv: unknown) => void }) => {
    mockSetSelectedISV = setSelectedISV;
    return null;
  },
}));

describe('ISVConnectorModal', () => {
  const mockSetIsOpen = jest.fn();

  beforeAll(() => {
    mockOffsetSize(200, 1000);
  });

  beforeEach(() => {
    mockOpenLink.mockReset();
    mockSetIsOpen.mockReset();
    mockSetSelectedISV = null;
    mockDeployedApps = [{ kind: 'zenko-ui', appHistoryBasePath: '/data' }];
    // Configure the global mockShellHooks to use our test-local mocks
    (mockShellHooks.useLinkOpener as jest.Mock).mockReturnValue({ openLink: mockOpenLink });
    (mockShellHooks.useDeployedApps as jest.Mock).mockImplementation(() => mockDeployedApps);
  });

  const renderModal = () =>
    render(
      <ISVConnectorModal
        isOpen={true}
        setIsOpen={mockSetIsOpen}
        shellHooks={mockShellHooks as unknown as ShellHooks}
        shellAlerts={mockShellAlerts as unknown as ShellAlerts}
      />,
    );

  const selectISV = async (isv: unknown) => {
    await act(async () => {
      mockSetSelectedISV(isv);
    });
  };

  it('calls openLink with ISV configuration path when an assistant ISV is selected', async () => {
    renderModal();
    await selectISV({ id: 'veeam-vbr', name: 'Veeam', assistant: true });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Continue to assistant/i }));
    });

    expect(mockOpenLink).toHaveBeenCalledWith(
      expect.objectContaining({
        view: expect.objectContaining({
          path: '/isv/configuration?platform=veeam-vbr',
          label: { en: 'ISV Configuration', fr: 'Configuration ISV' },
          module: './FederableApp',
          scope: 'zenko',
        }),
        isFederated: true,
      }),
    );
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  it('calls openLink with accounts path when a non-assistant ISV is selected', async () => {
    renderModal();
    await selectISV({ id: 'rubrik', name: 'Rubrik', assistant: false });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Continue to account/i }));
    });

    expect(mockOpenLink).toHaveBeenCalledWith(
      expect.objectContaining({
        view: expect.objectContaining({
          path: '/accounts',
          label: { en: 'Accounts', fr: 'Comptes' },
          module: './FederableApp',
          scope: 'zenko',
        }),
        isFederated: true,
      }),
    );
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });

  it('dispatches HistoryPushEvent instead of openLink when already in zenko-ui context', async () => {
    // App with appHistoryBasePath '' triggers the fallback branch → currentApp resolves to 'zenko-ui'
    mockDeployedApps = [
      { kind: 'zenko-ui', appHistoryBasePath: '/data' },
      { kind: 'zenko-ui', appHistoryBasePath: '' },
    ];

    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    renderModal();
    await selectISV({ id: 'veeam-vbr', name: 'Veeam', assistant: true });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Continue to assistant/i }));
    });

    expect(mockOpenLink).not.toHaveBeenCalled();
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'HistoryPushEvent',
        detail: { path: '/isv/configuration?platform=veeam-vbr' },
      }),
    );

    dispatchEventSpy.mockRestore();
  });

  it('closes the modal without navigating when Skip is clicked', async () => {
    renderModal();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /Skip/i }));
    });

    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
    expect(mockOpenLink).not.toHaveBeenCalled();
  });
});
