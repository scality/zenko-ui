import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import { coreUIAvailableThemes } from '@scality/core-ui/dist/style/theme';
import { MemoryRouter } from 'react-router';
import { mockOffsetSize } from '../../utils/testUtil';

jest.unmock('../AccountRoleSelectButtonAndModal');

import { AccountRoleSelectButtonAndModal } from '../AccountRoleSelectButtonAndModal';

const TEST_ROLE_ARN =
  'arn:aws:iam::000000000000:role/scality-internal/storage-manager-role';

jest.mock('../../DataServiceRoleProvider', () => ({
  useDataServiceRole: () => ({ roleArn: TEST_ROLE_ARN }),
  useCurrentAccount: () => ({ account: { Name: 'test-account' } }),
  useSetAssumedRolePromise: () => jest.fn(),
}));

jest.mock('../../utils/hooks', () => {
  const actual = jest.requireActual('../../utils/hooks');
  return {
    ...actual,
    useAccounts: () => ({
      accounts: [
        {
          Name: 'test-account',
          Roles: [
            {
              Name: 'storage-manager-role',
              Arn: 'arn:aws:iam::000000000000:role/scality-internal/storage-manager-role',
            },
            {
              Name: 'storage-usage-consumer-role',
              Arn: 'arn:aws:iam::000000000000:role/scality-internal/storage-usage-consumer-role',
            },
            {
              Name: 'my-custom-role',
              Arn: 'arn:aws:iam::000000000000:role/my-custom-role',
            },
          ],
        },
      ],
    }),
  };
});

const theme = coreUIAvailableThemes.darkRebrand;

beforeAll(() => {
  mockOffsetSize(800, 600);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('AccountRoleSelectButtonAndModal', () => {
  const selectors = {
    selectRoleButton: () =>
      screen.getByRole('button', { name: /Select Role/i }),
    modalTitle: () => screen.getByText('Select Account and Role to assume'),
    roleText: (name: string) => screen.findByText(name),
  };

  const openModal = async () => {
    render(
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={['/accounts/test-account']}>
          <AccountRoleSelectButtonAndModal buttonLabel="Select Role" />
        </MemoryRouter>
      </ThemeProvider>,
    );
    await userEvent.click(selectors.selectRoleButton());
    await waitFor(() => selectors.modalTitle());
  };

  const hoverTooltipNearText = (textElement: HTMLElement) => {
    const parentStack = textElement.parentElement!;
    const tooltip = parentStack.querySelector('.sc-tooltip');
    // Tooltip uses onPointerEnter, so fireEvent.pointerEnter is needed instead of userEvent.hover
    fireEvent.pointerEnter(tooltip!);
  };

  it('should show "Data Browser unavailable" tooltip for storage-usage-consumer-role', async () => {
    //S
    await openModal();

    //E
    const roleCell = await selectors.roleText('storage-usage-consumer-role');
    hoverTooltipNearText(roleCell);

    //V
    await waitFor(() => {
      expect(
        screen.getByText('Data Browser unavailable for this role'),
      ).toBeInTheDocument();
    });
  });

  it('should show "Scality predefined Role" tooltip for internal roles', async () => {
    //S
    await openModal();

    //E
    const roleCell = await selectors.roleText('storage-manager-role');
    hoverTooltipNearText(roleCell);

    //V
    await waitFor(() => {
      expect(
        screen.getByText('This is a Scality predefined Role'),
      ).toBeInTheDocument();
    });
  });

  it('should show permissions warning tooltip for custom roles', async () => {
    //S
    await openModal();

    //E
    const roleCell = await selectors.roleText('my-custom-role');
    hoverTooltipNearText(roleCell);

    //V
    await waitFor(() => {
      expect(
        screen.getByText(
          "Some sections of the UI may not be available depending on the role's permissions",
        ),
      ).toBeInTheDocument();
    });
  });
});
