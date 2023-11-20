import { Banner, Form, Icon, Text } from '@scality/core-ui';
import { Button, CopyButton } from '@scality/core-ui/dist/next';
import { Stack } from '@scality/core-ui/dist/spacing';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useHistory } from 'react-router-dom';
import { useTheme } from 'styled-components';
import { CertificateDownloadButton } from '../../next-architecture/ui/CertificateDownloadButton';
import { useAuthGroups } from '../../utils/hooks';
import { Clipboard } from '../Clipboard';
import { HideCredential } from '../Hide';
import Table, * as T from '../TableKeyValue';

type VeeamSummaryProps = Record<string, never>;

const TEMP_SERVICE_POINT = 'https://s3.pod-choco.local';
const TEMP_REGION = 'us-east-1';
const TEMP_BUCKET_NAME = 'veeam-bucket';
const TEMP_ACCESS_KEY_ID = 'JLVWC9DX45XLY0K9PVEX';
const TEMP_ACCESS_KEY_SECRET = 'EPJGOdLwTK';

export const VeeamSummary = (_: VeeamSummaryProps) => {
  const history = useHistory();
  const theme = useTheme();
  const { isPlatformAdmin } = useAuthGroups();

  return (
    <Form
      layout={{
        title: 'Veeam Repository preparation summary',
        kind: 'page',
      }}
      requireMode="all"
      rightActions={
        <Stack gap="r16">
          <p></p>
          <Button
            variant="primary"
            label={'Continue'}
            onClick={() => {
              //TODO: Redirect to the veeam bucket
              history.push('/accounts/Veeam12/buckets/veeam-bucket');
            }}
          />
        </Stack>
      }
      style={{
        height: 'calc(100vh - 100px)',
      }}
    >
      <div
        style={{
          backgroundColor: theme.brand.backgroundLevel3,
          padding: spacing.sp16,
        }}
      >
        <Stack gap="r16">
          <Text isEmphazed>
            ARTESCA is now ready for Veeam. You can use this data to set up your
            Veeam application.
          </Text>
          <CopyButton
            textToCopy={`Username\tveeam\nAccess key ID\t${TEMP_ACCESS_KEY_ID}\nSecret Access key\t${TEMP_ACCESS_KEY_SECRET}`}
            label="all"
            variant="outline"
            tooltip={{
              overlay:
                'Copy all the information below and paste it in a safe place. You will not be able to retrieve the Secret Access key afterwards.',
              placement: 'right',
            }}
            size="inline"
          />
        </Stack>
        <br />
        <br />
        <Stack direction="vertical" gap="r16">
          <b>Information for Veeam Account</b>
          <Table>
            <T.Body>
              <T.Row>
                <T.Key> Service point </T.Key>
                <T.Value> {TEMP_SERVICE_POINT}</T.Value>
                <T.ExtraCell>
                  <Clipboard text={TEMP_SERVICE_POINT} />
                </T.ExtraCell>
              </T.Row>
              <T.Row>
                <T.Key> Region </T.Key>
                <T.Value>{TEMP_REGION}</T.Value>
                <T.ExtraCell>
                  <Clipboard text={TEMP_REGION} />
                </T.ExtraCell>
              </T.Row>
            </T.Body>
          </Table>
        </Stack>
        <br />
        <Stack direction="vertical" gap="r16">
          <b>Credentials</b>
          <Banner icon={<Icon name="Exclamation-triangle" />} variant="warning">
            The Secret Access key cannot be retrieved afterwards, so make sure
            to keep and secure it now. <br />
            You will be able to create new Access keys at any time.
          </Banner>
          <Table>
            <T.Body>
              <T.Row>
                <T.Key> Access key ID </T.Key>
                <T.Value>{TEMP_ACCESS_KEY_ID}</T.Value>
                <T.ExtraCell>
                  <Clipboard text={TEMP_ACCESS_KEY_ID} />
                </T.ExtraCell>
              </T.Row>
              <T.Row>
                <T.Key> Secret Access key </T.Key>
                <T.Value>
                  <HideCredential credentials={TEMP_ACCESS_KEY_SECRET} />
                </T.Value>
                <T.ExtraCell>
                  <Clipboard text={TEMP_ACCESS_KEY_SECRET} />
                </T.ExtraCell>
              </T.Row>
            </T.Body>
          </Table>
        </Stack>
        <br />
        <Table style={{ marginTop: spacing.sp16 }}>
          <b>Bucket</b>
          <T.Body>
            <T.Row>
              <T.Key> Name </T.Key>
              <T.Value>{TEMP_BUCKET_NAME}</T.Value>
              <T.ExtraCell>
                <Clipboard text={TEMP_BUCKET_NAME} />
              </T.ExtraCell>
            </T.Row>
            <T.Row>
              <T.Key> Immutable backup </T.Key>
              <T.Value>
                Active
                <br />
                <Text variant="Smaller" color="textSecondary">
                  Make sure to check the "Make recent backups immutable"
                  checkbox when configuring the bucket in the Veeam Server.
                </Text>
              </T.Value>
            </T.Row>
          </T.Body>
        </Table>
        <br />
        {isPlatformAdmin ? (
          <Stack direction="vertical" gap="r16">
            <b>Certificate</b>
            <Text color="textSecondary">
              Trust the ARTESCA CA Root on your Veeam server to maintain
              uninterrupted service.
            </Text>
            <CertificateDownloadButton />
          </Stack>
        ) : (
          <></>
        )}
      </div>
    </Form>
  );
};
