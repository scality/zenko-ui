import { useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Button } from '@scality/core-ui/dist/next';
import { CustomModal as Modal } from './Modal';
import React from 'react';
import { useLocation } from 'react-router';
import { spacing } from '@scality/core-ui/dist/style/theme';
import AccountRoleSelectButtonAndModal from '../account/AccountRoleSelectButtonAndModal';
import DataServiceRoleProvider from '../DataServiceRoleProvider';
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
      id="reauth-dialog-modal"
      close={() => {
        window.location.reload();
      }}
      footer={
        <div>
          {oidcLogout && (
            <Button
              style={{
                marginRight: spacing.sp24,
              }}
              icon={<i className="fas fa-sign-out-alt" />}
              variant="secondary"
              onClick={() => oidcLogout(true)}
              label="Log Out"
            />
          )}
          <DataServiceRoleProvider>
            <AccountRoleSelectButtonAndModal
              bigButton
              buttonLabel="Switch Account"
            />
          </DataServiceRoleProvider>
        </div>
      }
      isOpen={true}
      title="Authentication Error"
    >
      {errorMessage || DEFAULT_MESSAGE}
    </Modal>
  );
};

export default ReauthDialog;
