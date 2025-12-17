import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithRouterMatch } from '../../../../utils/testUtil';
import SecretKeyModal from '../SecretKeyModal';
import { Account } from '../../../../../types/account';

const account: Account = {
  Name: 'bart',
  CreationDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
  Roles: [],
  id: '1',
};
const accountKey = {
  userName: 'bart',
  accessKey: 'ak1',
  secretKey: 'sk1',
};
const hiddenValue = '*********';

describe('SecretKeyModal', () => {
  const modalTitle = 'Create Root user Access keys';
  const mockOnClose = jest.fn();
  const mockOnKeyCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render SecretKeyModal if closed', async () => {
    renderWithRouterMatch(
      <SecretKeyModal
        account={account}
        isOpen={false}
        accountKey={null}
        onClose={mockOnClose}
        onKeyCreated={mockOnKeyCreated}
      />,
    );
    expect(screen.queryByText(modalTitle)).not.toBeInTheDocument();
  });

  it('should render SecretKeyModal component with key informations', async () => {
    const writeTextFn = jest.fn();
    //@ts-expect-error fix this when you are working on it
    global.navigator.clipboard = {
      writeText: writeTextFn,
    };

    renderWithRouterMatch(
      <SecretKeyModal
        account={account}
        isOpen={true}
        accountKey={accountKey}
        onClose={mockOnClose}
        onKeyCreated={mockOnKeyCreated}
      />,
    );
    expect(screen.queryByText(modalTitle)).toBeInTheDocument();

    expect(screen.getByText('Account name')).toBeInTheDocument();
    expect(screen.getByText('Access key ID')).toBeInTheDocument();
    expect(screen.getByText('Secret Access key')).toBeInTheDocument();

    expect(screen.getByText(accountKey.userName)).toBeInTheDocument();
    expect(screen.getByText(accountKey.accessKey)).toBeInTheDocument();
    expect(screen.getByText(hiddenValue)).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', {
        name: /copy to clipboard/i,
      }),
    );

    expect(writeTextFn).toHaveBeenCalledTimes(1);
  });
});
