import { useSelector } from 'react-redux';
import { AppState } from '../../types/state';
import { CustomModal as Modal } from './Modal';
import { useLocation } from 'react-router';
import { Wrap } from '@scality/core-ui';
import AccountRoleSelectButtonAndModal from '../account/AccountRoleSelectButtonAndModal';
import { useAuthError } from '../ErrorProvider';

const DEFAULT_MESSAGE = 'We need to log you in.';

const ReauthDialog = () => {
  const { pathname } = useLocation();
  const { authError } = useAuthError();
  const needReauth = useSelector(
    (state: AppState) => state.networkActivity.authFailure,
  );

  const errorMessage = authError
    ? pathname.indexOf('/accounts') !== -1
      ? 'Access denied'
      : authError
    : null;

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
          <AccountRoleSelectButtonAndModal
            bigButton
            buttonLabel="Switch Account"
          />
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
