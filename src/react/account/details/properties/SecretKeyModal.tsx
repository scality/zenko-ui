import type { Account, AccountKey } from '../../../../types/account';
import { CustomModal as Modal, ModalBody } from '../../../ui-elements/Modal';
import Table, * as T from '../../../ui-elements/TableKeyValue';
import {
  closeAccountKeyCreateModal,
  createAccountAccessKey,
  deleteAccountSecret,
} from '../../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../../types/state';
import { Banner, Icon, Stack, Wrap } from '@scality/core-ui';
import { Button, CopyButton } from '@scality/core-ui/dist/next';
import { Clipboard } from '../../../ui-elements/Clipboard';
import { HideCredential } from '../../../ui-elements/Hide';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useDataServiceRole } from '../../../DataServiceRoleProvider';
import { Box } from '@scality/core-ui/dist/next';
import styled from 'styled-components';
type Props = {
  account: Account;
};

const StyledCopybutton = styled(CopyButton)({
  height: '1.914rem',
  width: '11rem',
});

function SecretKeyModal({ account }: Props) {
  const dispatch = useDispatch();
  const accountKey = useSelector((state: AppState) => state.secrets.accountKey);
  const isModalOpen = useSelector(
    (state: AppState) => state.uiAccounts.showKeyCreate,
  );

  const handleClose = () => {
    dispatch(deleteAccountSecret());
    dispatch(closeAccountKeyCreateModal());
  };
  const { roleArn } = useDataServiceRole();
  const handleAccessKeyCreate = () => {
    dispatch(createAccountAccessKey(account.Name, roleArn));
  };

  if (!isModalOpen) {
    return null;
  }

  const modalFooter = (key: AccountKey | null) => {
    const isFirstModal = key === null;

    if (isFirstModal) {
      return (
        <Wrap>
          <p></p>
          <Stack>
            <Button variant="outline" onClick={handleClose} label="Cancel" />
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

    return <Button onClick={handleClose} variant="primary" label="Close" />;
  };

  return (
    <Modal
      close={handleClose}
      footer={modalFooter(accountKey)}
      isOpen={true}
      title="Create Root user Access keys"
    >
      {modalBody(accountKey)}
    </Modal>
  );
}

const modalBody = (key: AccountKey | null) => {
  if (key === null) {
    return (
      <ModalBody>
        A Root user Access key ID and its Secret Access key will be created.{' '}
        <br />
        Note: <br />
        - the Secret Access key will be visible only at this step, <br />- Root
        user Access keys provide unrestricted access to the account resources.
      </ModalBody>
    );
  }

  return (
    <ModalBody>
      <Banner icon={<Icon name="Exclamation-triangle" />} variant="warning">
        A Root user Access key ID and its Secret Access key have been created.{' '}
        <br />
        The Secret Access key cannot be retrieved afterwards, so make sure to
        keep and secure it now. <br />
        You will be able to create new Access keys at any time.
      </Banner>
      <Table
        style={{
          marginTop: spacing.sp16,
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
      <Box
        display={'flex'}
        style={{ alignItems: 'end', flexDirection: 'column' }}
      >
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
