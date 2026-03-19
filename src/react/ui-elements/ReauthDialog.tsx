import { Wrap } from '@scality/core-ui';
import { useLocation } from 'react-router';
import AccountRoleSelectButtonAndModal from '../account/AccountRoleSelectButtonAndModal';
import { useAuthError, useAuthFailure } from '../ErrorProvider';
import { CustomModal as Modal } from './Modal';

const DEFAULT_MESSAGE = 'We need to log you in.';

const ReauthDialog = () => {
  const { pathname } = useLocation();
  const { authError } = useAuthError();
  const { authFailure: needReauth } = useAuthFailure();

  const errorMessage = authError ? (pathname.indexOf('/accounts') !== -1 ? 'Access denied' : authError) : null;

  if (!needReauth) {
    return null;
  }

  return (
    <Modal
      close={() => {
        window.location.reload();
      }}
      footer={
        <Wrap>
          <p></p>
          <AccountRoleSelectButtonAndModal bigButton buttonLabel="Switch Account" />
        </Wrap>
      }
      isOpen={true}
      title="Authentication Error"
    >
      {errorMessage || DEFAULT_MESSAGE}
    </Modal>
  );
};

export default ReauthDialog;
