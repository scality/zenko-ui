jest.unmock('../AccountRoleSelectButtonAndModal');

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockOffsetSize, renderWithCustomRoute, Wrapper } from '../../utils/testUtil';
import AccountRoleSelectButtonAndModal from '../AccountRoleSelectButtonAndModal';
import * as hooks from '../../utils/hooks';

const STORAGE_MANAGER_ARN = 'arn:aws:iam::000000000000:role/scality-internal/storage-manager-role';
const STORAGE_USAGE_CONSUMER_ARN = 'arn:aws:iam::000000000000:role/scality-internal/storage-usage-consumer-role';
const CUSTOM_ROLE_ARN = 'arn:aws:iam::000000000000:role/my-custom-role';
const ANOTHER_ACCOUNT_STORAGE_MANAGER_ARN =
  'arn:aws:iam::111111111111:role/scality-internal/storage-manager-role';

const mockNavigate = jest.fn();
jest.mock('@scality/module-federation', () => ({
  useShellHooks: jest.fn(),
  useBasenameRelativeNavigate: jest.fn().mockImplementation(() => mockNavigate),
}));

let useAccountsSpy: jest.SpyInstance;

async function renderOpenModal(roles: { Name: string; Arn: string }[]) {
  useAccountsSpy = jest.spyOn(hooks, 'useAccounts').mockReturnValue({
    accounts: [{ Name: 'test-account', id: '000000000000', Roles: roles }],
  } as any);

  render(
    <Wrapper>
      <AccountRoleSelectButtonAndModal />
    </Wrapper>,
  );

  await userEvent.click(screen.getByRole('button'));
  await screen.findByText('Select Account and Role to assume');
}

async function renderOpenModalOnRoute(
  roles: { Name: string; Arn: string }[],
  accounts: { Name: string; id: string; Roles: { Name: string; Arn: string }[] }[],
  route: string,
) {
  useAccountsSpy = jest.spyOn(hooks, 'useAccounts').mockReturnValue({
    accounts,
  } as any);

  renderWithCustomRoute(
    <AccountRoleSelectButtonAndModal />,
    route,
  );

  await userEvent.click(screen.getByRole('button'));
  await screen.findByText('Select Account and Role to assume');
}

describe('AccountRoleSelectButtonAndModal - role name cell', () => {
  beforeAll(() => {
    mockOffsetSize(200, 800);
  });

  afterEach(() => {
    useAccountsSpy?.mockRestore();
    mockNavigate.mockReset();
  });

  it('shows info tooltip for storage-usage-consumer-role cell', async () => {
    await renderOpenModal([{ Name: 'storage-usage-consumer-role', Arn: STORAGE_USAGE_CONSUMER_ARN }]);

    await screen.findByText('storage-usage-consumer-role');

    const infoIcon = await screen.findByRole('img', { name: /Info: limited access role/i });
    await userEvent.hover(infoIcon);
    expect(screen.getByText(/This role has limited access to some UI sections/i)).toBeInTheDocument();
  });

  it('shows warning banner when storage-usage-consumer-role row is selected', async () => {
    await renderOpenModal([{ Name: 'storage-usage-consumer-role', Arn: STORAGE_USAGE_CONSUMER_ARN }]);

    await userEvent.click(await screen.findByText('storage-usage-consumer-role'));
    expect(screen.getByText('Data Browser unavailable for this role')).toBeInTheDocument();
  });

  it('shows a generic info tooltip for other Scality predefined roles', async () => {
    await renderOpenModal([{ Name: 'storage-manager-role', Arn: STORAGE_MANAGER_ARN }]);

    await screen.findByText('storage-manager-role');

    const infoIcon = await screen.findByRole('img', { name: /Info: Scality predefined role/i });
    await userEvent.hover(infoIcon);
    expect(screen.getByText(/This is a Scality predefined Role/i)).toBeInTheDocument();
  });

  it('shows an info tooltip warning about limited access for custom IAM roles', async () => {
    await renderOpenModal([{ Name: 'my-custom-role', Arn: CUSTOM_ROLE_ARN }]);

    await screen.findByText('my-custom-role');

    const infoIcon = await screen.findByRole('img', { name: /Info: role may have limited access/i });
    await userEvent.hover(infoIcon);
    expect(
      screen.getByText(/Some UI sections may not be available depending on this role's permissions/i),
    ).toBeInTheDocument();
  });
});

describe('AccountRoleSelectButtonAndModal - handleAccountClick navigation', () => {
  const accounts = [
    {
      Name: 'current-account',
      id: '000000000000',
      Roles: [{ Name: 'storage-manager-role', Arn: STORAGE_MANAGER_ARN }],
    },
    {
      Name: 'another-account',
      id: '111111111111',
      Roles: [{ Name: 'storage-manager-role', Arn: ANOTHER_ACCOUNT_STORAGE_MANAGER_ARN }],
    },
  ];

  beforeAll(() => {
    mockOffsetSize(200, 800);
  });

  beforeEach(() => {
    mockNavigate.mockReset();
  });

  afterEach(() => {
    useAccountsSpy?.mockRestore();
  });

  it('navigates to /accounts/{assumedAccount}/buckets on a param-less route like /workflows', async () => {
    await renderOpenModalOnRoute(
      [{ Name: 'storage-manager-role', Arn: ANOTHER_ACCOUNT_STORAGE_MANAGER_ARN }],
      accounts,
      '/workflows',
    );

    await userEvent.click(await screen.findByText('another-account'));

    const continueButton = screen.getByRole('button', { name: /Continue/i });
    await userEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalledWith('/accounts/another-account/buckets');
  });

  it('navigates to /accounts/{assumedAccount}/buckets on a route with :accountName param', async () => {
    await renderOpenModalOnRoute(
      [{ Name: 'storage-manager-role', Arn: ANOTHER_ACCOUNT_STORAGE_MANAGER_ARN }],
      accounts,
      '/accounts/current-account/buckets',
    );

    await userEvent.click(await screen.findByText('another-account'));

    const continueButton = screen.getByRole('button', { name: /Continue/i });
    await userEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalledWith('/accounts/another-account/buckets');
  });
});
