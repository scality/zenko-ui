jest.unmock('../AccountRoleSelectButtonAndModal');

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockOffsetSize, Wrapper } from '../../utils/testUtil';
import AccountRoleSelectButtonAndModal from '../AccountRoleSelectButtonAndModal';
import * as hooks from '../../utils/hooks';

const STORAGE_MANAGER_ARN = 'arn:aws:iam::000000000000:role/scality-internal/storage-manager-role';
const STORAGE_USAGE_CONSUMER_ARN = 'arn:aws:iam::000000000000:role/scality-internal/storage-usage-consumer-role';
const CUSTOM_ROLE_ARN = 'arn:aws:iam::000000000000:role/my-custom-role';

async function renderOpenModal(roles: { Name: string; Arn: string }[]) {
  jest.spyOn(hooks, 'useAccounts').mockReturnValue({
    accounts: [{ Name: 'test-account', id: '000000000000', Roles: roles }],
  } as any);

  render(
    <Wrapper>
      <AccountRoleSelectButtonAndModal />
    </Wrapper>,
  );

  await userEvent.click(screen.getByRole('button'));
  await waitFor(() => {
    expect(screen.getByText('Select Account and Role to assume')).toBeInTheDocument();
  });
}

describe('AccountRoleSelectButtonAndModal - role name cell', () => {
  beforeAll(() => {
    mockOffsetSize(200, 800);
  });

  afterEach(() => {
    jest.spyOn(hooks, 'useAccounts').mockRestore();
  });

  it('shows a warning tooltip for storage-usage-consumer-role', async () => {
    await renderOpenModal([{ Name: 'storage-usage-consumer-role', Arn: STORAGE_USAGE_CONSUMER_ARN }]);

    await waitFor(() => {
      expect(screen.getByText('storage-usage-consumer-role')).toBeInTheDocument();
    });

    const warningIcon = await screen.findByRole('img', { name: /Exclamation-circle/i });
    await userEvent.hover(warningIcon);
    expect(screen.getByText(/This role has limited access to some UI sections/i)).toBeInTheDocument();
  });

  it('shows a generic info tooltip for other Scality predefined roles', async () => {
    await renderOpenModal([{ Name: 'storage-manager-role', Arn: STORAGE_MANAGER_ARN }]);

    await waitFor(() => {
      expect(screen.getByText('storage-manager-role')).toBeInTheDocument();
    });

    const infoIcon = await screen.findByRole('img', { name: /Info/i });
    await userEvent.hover(infoIcon);
    expect(screen.getByText(/This is a Scality predefined Role/i)).toBeInTheDocument();
  });

  it('shows an info tooltip warning about limited access for custom IAM roles', async () => {
    await renderOpenModal([{ Name: 'my-custom-role', Arn: CUSTOM_ROLE_ARN }]);

    await waitFor(() => {
      expect(screen.getByText('my-custom-role')).toBeInTheDocument();
    });

    const infoIcon = await screen.findByRole('img', { name: /Info/i });
    await userEvent.hover(infoIcon);
    expect(
      screen.getByText(/Some UI sections may not be available depending on this role's permissions/i),
    ).toBeInTheDocument();
  });
});
