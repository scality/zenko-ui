import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { debug } from 'jest-preview';

import { renderWithRouterMatch } from '../../../../utils/testUtil';
import SecretKeyModal from '../SecretKeyModal';

const account = {
  arn: 'arn1',
  canonicalId: 'canonicalId1',
  createDate: Date.parse('04 Jan 2000 05:12:00 GMT'),
  email: 'test@email1.com',
  id: '1',
  quotaMax: 1,
  Name: 'bart',
};
const accountKey = {
  userName: 'bart',
  accessKey: 'ak1',
  secretKey: 'sk1',
};
const hiddenValue = '*********';

describe('SecretKeyModal', () => {
  const modalTitle = 'Create Root user Access keys';
  it('should not render SecretKeyModal if closed', async () => {
    renderWithRouterMatch(<SecretKeyModal account={account} />);
    expect(screen.queryByText(modalTitle)).not.toBeInTheDocument();
  });

  it('should render SecretKeyModal component with key informations', () => {
    const writeTextFn = jest.fn();
    global.navigator.clipboard = {
      writeText: writeTextFn,
    };

    renderWithRouterMatch(<SecretKeyModal account={account} />, undefined, {
      uiAccounts: {
        showKeyCreate: true,
      },
      secrets: {
        accountKey,
      },
    });
    expect(screen.queryByText(modalTitle)).toBeInTheDocument();

    expect(screen.getByText('Account name')).toBeInTheDocument();
    expect(screen.getByText('Access key ID')).toBeInTheDocument();
    expect(screen.getByText('Secret Access key')).toBeInTheDocument();

    expect(screen.getByText(accountKey.userName)).toBeInTheDocument();
    expect(screen.getByText(accountKey.accessKey)).toBeInTheDocument();
    expect(screen.getByText(hiddenValue)).toBeInTheDocument();

    userEvent.click(
      screen.getByRole('button', {
        name: /copy to clipboard/i,
      }),
    );

    expect(writeTextFn).toHaveBeenCalledTimes(1);
  });
});
