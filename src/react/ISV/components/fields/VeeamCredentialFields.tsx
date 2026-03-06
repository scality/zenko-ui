import {
  Banner,
  FormGroup,
  Icon,
  Stack,
  useToast,
} from '@scality/core-ui';
import { Box, Button, Input } from '@scality/core-ui/dist/next';
import { useEffect, useState } from 'react';
import { useVeeamCredentialManagement } from '../../contexts/VeeamCredentialContext';

const VeeamCredentialFieldsForm = () => {
  const { changeCredentialsMutation, newCredentialsStatus } =
    useVeeamCredentialManagement();
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (newCredentialsStatus === 'VALID') {
      showToast({
        open: true,
        status: 'success',
        message: 'Veeam credentials updated successfully',
      });
    } else if (newCredentialsStatus === 'INVALID') {
      showToast({
        open: true,
        status: 'error',
        message:
          'Veeam credentials are invalid. Please check your username and password.',
      });
    } else if (newCredentialsStatus === 'ERROR') {
      showToast({
        open: true,
        status: 'error',
        message: 'Failed to update Veeam credentials. Please try again.',
      });
    }
  }, [newCredentialsStatus]);

  const handleSubmit = () => {
    if (changeCredentialsMutation && username && password) {
      changeCredentialsMutation.mutate({ username, password });
    }
  };

  const isUpdating = newCredentialsStatus === 'WAITING';

  return (
    <Stack gap="r16" direction="vertical">
      <Banner
        variant="warning"
        icon={<Icon name="Exclamation-circle" />}
        title="Veeam Credentials required"
      >
        To automatically create the repository, ARTESCA needs credentials for a
        Veeam Backup Administrator.
        <br />
        You can skip this by disabling the repository automatic creation, but
        you will need to configure the repository in Veeam yourself.
      </Banner>

      <FormGroup
        id="veeam-username"
        label="Username"
        required
        helpErrorPosition="bottom"
        content={
          <Input
            id="veeam-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isUpdating}
          />
        }
      />

      <FormGroup
        id="veeam-password"
        label="Password"
        required
        helpErrorPosition="bottom"
        content={
          <Input
            id="veeam-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            size="1"
            disabled={isUpdating}
          />
        }
      />

      <Box
        display="flex"
        alignItems="baseline"
        flexDirection="row"
        gap="32"
        justifyContent="flex-end"
      >
        <Button
          type="button"
          variant="primary"
          label="Update Veeam credentials"
          disabled={!username || !password}
          isLoading={isUpdating}
          onClick={handleSubmit}
        />
      </Box>
    </Stack>
  );
};

export const VeeamCredentialFields = () => {
  const { isCredentialsValid } = useVeeamCredentialManagement();

  if (isCredentialsValid) {
    return null;
  }

  return <VeeamCredentialFieldsForm />;
};
