import { useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui/dist/next';
import { CustomModal as Modal } from './Modal';
import { useLocation } from 'react-router-dom';
import { spacing } from '@scality/core-ui/dist/style/theme';
import AccountRoleSelectButtonAndModal from '../account/AccountRoleSelectButtonAndModal';
import { Icon, Stack, Wrap } from '@scality/core-ui';
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
  const oidcLogout = useSelector((state: AppState) => state.auth.oidcLogout);

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
          <Stack>
            {oidcLogout && (
              <Button
                style={{
                  marginRight: spacing.sp24,
                }}
                icon={<Icon name="Log-out" />}
                variant="secondary"
                onClick={() => oidcLogout(true)}
                label="Log Out"
              />
            )}

            <AccountRoleSelectButtonAndModal
              bigButton
              buttonLabel="Switch Account"
            />
          </Stack>
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
