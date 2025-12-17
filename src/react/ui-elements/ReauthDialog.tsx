import { useSelector } from 'react-redux';
import { AppState } from '../../types/state';
import { CustomModal as Modal } from './Modal';
import { useLocation } from 'react-router';
import { Wrap } from '@scality/core-ui';
import AccountRoleSelectButtonAndModal from '../account/AccountRoleSelectButtonAndModal';
const DEFAULT_MESSAGE = 'We need to log you in.';

const ReauthDialog = () => {
  const { pathname } = useLocation();
  const needReauth = useSelector(
    (state: AppState) => state.networkActivity.authFailure,
  );
  const errorMessage = useSelector((state: AppState) => {
    if (state.uiErrors.errorType === 'byAuth') {
      return pathname.indexOf('/accounts') !== -1
        ? 'Access denied'
        : state.uiErrors.errorMsg;
    }
    return null;
  });

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
