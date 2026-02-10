import { Banner, Icon, Stack, spacing, Wrap } from '@scality/core-ui';
import { Box, Button, CopyButton } from '@scality/core-ui/dist/next';
import { useShellHooks } from '@scality/module-federation';
import { useMutation, useQueryClient } from 'react-query';
import styled from 'styled-components';
import type { Account, AccountKey } from '../../../../types/account';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { useDataServiceRole } from '../../../DataServiceRoleProvider';
import { useModalError } from '../../../ErrorProvider';
import { useManagementClient } from '../../../ManagementProvider';
import { useInstanceId } from '../../../next-architecture/ui/AuthProvider';
import { HideCredential } from '../../../ui-elements/Hide';
import { CustomModal as Modal, ModalBody } from '../../../ui-elements/Modal';
import Table, * as T from '../../../ui-elements/TableKeyValue';
import { ACCESS_KEYS_QUERY_KEY } from './useAccessKeysQuery';

type Props = {
  account: Account;
  isOpen: boolean;
  accountKey: AccountKey | null;
  onClose: () => void;
  onKeyCreated: (key: AccountKey) => void;
};

const StyledCopybutton = styled(CopyButton)({
  height: '1.914rem',
  width: '11rem',
});

function SecretKeyModal({ account, isOpen, accountKey, onClose, onKeyCreated }: Props) {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const { roleArn } = useDataServiceRole();
  const queryClient = useQueryClient();
  const { showModalError } = useModalError();
  const managementClient = useManagementClient();
  const instanceId = useInstanceId();

  const createAccessKeyMutation = useMutation({
    mutationFn: async () => {
      const client = notFalsyTypeGuard(managementClient);
      client.setToken(await getToken());
      return client.generateKeyConfigurationOverlayUser(instanceId, account.Name);
    },
    onSuccess: (resp) => {
      onKeyCreated({
        userName: resp.userName,
        accessKey: resp.accessKey,
        secretKey: resp.secretKey,
      });
      queryClient.invalidateQueries([ACCESS_KEYS_QUERY_KEY, roleArn]);
    },
    onError: (error: Error) => {
      showModalError(error.message || 'Failed to create access key');
    },
  });

  const handleAccessKeyCreate = () => {
    createAccessKeyMutation.mutate();
  };

  const modalFooter = (key: AccountKey | null) => {
    const isFirstModal = key === null;

    if (isFirstModal) {
      return (
        <Wrap>
          <p></p>
          <Stack>
            <Button variant="outline" onClick={onClose} label="Cancel" />
            <Button
              icon={<Icon name="Arrow-right" />}
              variant="primary"
              onClick={handleAccessKeyCreate}
              label="Continue"
            />
          </Stack>
        </Wrap>
      );
    }

    return (
      <Wrap>
        <p></p>
        <Button onClick={onClose} variant="primary" label="Close" />
      </Wrap>
    );
  };

  return (
    <Modal close={onClose} footer={modalFooter(accountKey)} isOpen={isOpen} title="Create Root user Access keys">
      {modalBody(accountKey)}
    </Modal>
  );
}

const modalBody = (key: AccountKey | null) => {
  if (key === null) {
    return (
      <ModalBody>
        A Root user Access key ID and its Secret Access key will be created. <br />
        Note: <br />- the Secret Access key will be visible only at this step, <br />- Root user Access keys provide
        unrestricted access to the account resources.
      </ModalBody>
    );
  }

  return (
    <ModalBody>
      <Banner icon={<Icon name="Exclamation-circle" />} variant="warning">
        A Root user Access key ID and its Secret Access key have been created. <br />
        The Secret Access key cannot be retrieved afterwards, so make sure to keep and secure it now. <br />
        You will be able to create new Access keys at any time.
      </Banner>
      <Table
        style={{
          marginTop: spacing.r16,
        }}
      >
        <T.Body>
          <T.Row>
            <T.Key> Account name </T.Key>
            <T.Value> {key.userName} </T.Value>
          </T.Row>
          <T.Row>
            <T.Key> Access key ID </T.Key>
            <T.Value> {key.accessKey} </T.Value>
            <T.ExtraCell>
              {' '}
              <CopyButton textToCopy={key.accessKey} />{' '}
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
              <CopyButton textToCopy={key.secretKey} />{' '}
            </T.ExtraCell>
          </T.Row>
        </T.Body>
      </Table>
      <Box display={'flex'} style={{ alignItems: 'end', flexDirection: 'column' }}>
        <StyledCopybutton
          textToCopy={`Username\t${key.userName}\nAccess key ID\t${key.accessKey}\nSecret Access key\t${key.secretKey}`}
          label="to Clipboard"
          variant="outline"
        />
      </Box>
    </ModalBody>
  );
};

export default SecretKeyModal;
