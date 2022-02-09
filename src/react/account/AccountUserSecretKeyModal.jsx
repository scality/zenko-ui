// @flow
import type { Account, AccountKey } from '../../types/account';
import { CustomModal as Modal, ModalBody } from '../ui-elements/Modal';
import Table, * as T from '../ui-elements/TableKeyValue';
import {
  closeAccountKeyCreateModal,
  createAccountAccessKey,
  deleteAccountSecret,
} from '../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { Banner } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { Clipboard } from '../ui-elements/Clipboard';
import { HideCredential } from '../ui-elements/Hide';
import React, { useState } from 'react';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useHistory } from 'react-router-dom';
import { useIAMClient } from '../IAMProvider';
import { useMutation } from 'react-query';
import { queryClient } from '../App';

type Props = {
  IAMUserName: string,
};

function AccountUserSecretKeyModal({ IAMUserName }: Props) {
  const history = useHistory();
  const IAMClient = useIAMClient();
  const [newKey, setNewKey] = useState(null);

  const createAccessKeyMutation = useMutation(userName => {
    return IAMClient.createAccessKey(userName).then(res => {
      const newKey = {
        accountName: res.AccessKey.UserName,
        accessKey: res.AccessKey.AccessKeyId,
        secretKey: res.AccessKey.SecretAccessKey,
      };
      setNewKey(newKey);
      queryClient.invalidateQueries('listIAMClientUserAccessKeys');
      // invalidate stuff
    });
  });

  const handleClose = () => {
    history.push('.');
    // dispatch(deleteAccountSecret());
    // dispatch(closeAccountKeyCreateModal());
  };

  const handleAccessKeyCreate = () => {
    createAccessKeyMutation.mutate(IAMUserName);
  };

  const modalFooter = (key: AccountKey | null) => {
    const isFirstModal = key === null;
    if (isFirstModal) {
      return (
        <div>
          <Button variant="outline" onClick={handleClose} label="Cancel" />
          <Button
            icon={<i className="fas fa-arrow-right" />}
            variant="primary"
            onClick={handleAccessKeyCreate}
            label="Continue"
          />
        </div>
      );
    }
    return <Button onClick={handleClose} variant="primary" label="Close" />;
  };

  return (
    <Modal
      close={handleClose}
      footer={modalFooter(newKey)}
      isOpen={true}
      title="Create Root user Access keys"
    >
      {modalBody(newKey)}
    </Modal>
  );
}

const modalBody = (key: AccountKey | null) => {
  if (key === null) {
    return (
      <ModalBody>
        A Access key ID and its Secret Access key will be created. <br />
        The Secret Access key will be visible only at this step.
      </ModalBody>
    );
  }
  return (
    <ModalBody>
      <Banner
        icon={<i className="fas fa-exclamation-triangle" />}
        variant="warning"
      >
        A Access key ID and its Secret Access key have been created. <br />
        The Secret Access key cannot be retrieved afterwards, so make sure to
        keep and secure it now. <br />
        You can create new Access keys at any times.
      </Banner>
      <Table style={{ marginTop: spacing.sp16 }}>
        <T.Body>
          <T.Row>
            <T.Key> Account name </T.Key>
            <T.Value> {key.accountName} </T.Value>
          </T.Row>
          <T.Row>
            <T.Key> Access key ID </T.Key>
            <T.Value> {key.accessKey} </T.Value>
            <T.ExtraCell>
              {' '}
              <Clipboard text={key.accessKey} />{' '}
            </T.ExtraCell>
          </T.Row>
          <T.Row>
            <T.Key> Secret Access key </T.Key>
            <T.Value>
              {' '}
              <HideCredential credentials={key.secretKey} />{' '}
            </T.Value>
            <T.ExtraCell>
              {' '}
              <Clipboard text={key.secretKey} />{' '}
            </T.ExtraCell>
          </T.Row>
        </T.Body>
      </Table>
    </ModalBody>
  );
};

export default AccountUserSecretKeyModal;
