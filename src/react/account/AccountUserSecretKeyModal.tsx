import type { AccountKey } from '../../types/account';
import { CustomModal as Modal, ModalBody } from '../ui-elements/Modal';
import Table, * as T from '../ui-elements/TableKeyValue';
import { Banner, Icon } from '@scality/core-ui';
import { Box, Button, CopyButton } from '@scality/core-ui/dist/next';
import { Clipboard } from '../ui-elements/Clipboard';
import { HideCredential } from '../ui-elements/Hide';
import React, { useState } from 'react';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useHistory } from 'react-router-dom';
import { useIAMClient } from '../IAMProvider';
import { useMutation } from 'react-query';
import { queryClient } from '../App';
import { getUserAccessKeysQuery } from '../queries';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import styled from 'styled-components';
import { useCurrentAccount } from '../DataServiceRoleProvider';
type Props = {
  IAMUserName: string;
};

const StyledCopybutton = styled(CopyButton)({
  height: '1.914rem',
  width: '11rem',
});

function AccountUserSecretKeyModal({ IAMUserName }: Props) {
  const history = useHistory();
  const IAMClient = useIAMClient();
  const [newKey, setNewKey] = useState(null);
  const { account } = useCurrentAccount();

  const accountName = account?.Name;
  const createAccessKeyMutation = useMutation(
    (userName) => {
      return IAMClient.createAccessKey(userName).then((res) => {
        const newKey = {
          userName: res.AccessKey.UserName,
          accessKey: res.AccessKey.AccessKeyId,
          secretKey: res.AccessKey.SecretAccessKey,
        };
        setNewKey(newKey);
      });
    },
    {
      onSuccess: () =>
        queryClient.invalidateQueries(
          getUserAccessKeysQuery(IAMUserName, IAMClient).queryKey,
        ),
    },
  );

  const handleClose = () => {
    history.push('.');
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
            icon={<Icon name="Arrow-right" />}
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
      title="Create Access keys"
    >
      {modalBody(newKey, accountName)}
    </Modal>
  );
}

const modalBody = (key: AccountKey | null, accountName: string) => {
  if (key === null) {
    return (
      <ModalBody>
        An Access key ID and its Secret Access key will be created. <br />
        The Secret Access key will be visible only at this step.
      </ModalBody>
    );
  }

  return (
    <ModalBody>
      <Banner icon={<Icon name="Exclamation-triangle" />} variant="warning">
        An Access key ID and its Secret Access key have been created. <br />
        The Secret Access key cannot be retrieved afterwards, so make sure to
        keep and secure it now. <br />
        You can create new Access keys at any times.
      </Banner>
      <Table
        style={{
          marginTop: spacing.sp16,
        }}
      >
        <T.Body>
          <T.Row>
            <T.Key> Username </T.Key>
            <T.Value> {key.userName} </T.Value>
          </T.Row>
          <T.Row>
            <T.Key> Account name </T.Key>
            <T.Value> {accountName} </T.Value>
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
      <Box display="flex" alignItems="flex-end" flexDirection="column">
        <StyledCopybutton
          variant="outline"
          textToCopy={`Username\t${key.userName}\nAccount name\t${accountName}\nAccess key ID\t${key.accessKey}\nSecret Access key\t${key.secretKey}`}
          label="to Clipboard"
        />
      </Box>
    </ModalBody>
  );
};

export default AccountUserSecretKeyModal;
