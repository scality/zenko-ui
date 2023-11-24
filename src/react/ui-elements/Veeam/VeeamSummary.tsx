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
import { useGetS3ServicePoint } from './useGetS3ServicePoint';

type VeeamSummaryProps = {
  bucketName: string;
  enableImmutableBackup: boolean;
  accessKey: string;
  secretKey: string;
};

export const VEEAM_SUMMARY_TITLE = 'Veeam Repository preparation summary';
export const ACCOUNT_SECTION_TITLE = 'Information for Veeam Account';
export const CREDENTIALS_SECTION_TITLE = 'Credentials';
export const BUCKET_SECTION_TITLE = 'Bucket';
export const CERTIFICATE_SECTION_TITLE = 'Certificate';

const DEFAULT_REGION = 'us-east-1';

export const VeeamSummary = ({
  bucketName,
  enableImmutableBackup,
  accessKey,
  secretKey,
}: VeeamSummaryProps) => {
  const history = useHistory();
  const theme = useTheme();
  const { isPlatformAdmin } = useAuthGroups();
  const { s3ServicePoint } = useGetS3ServicePoint();

  return (
    <Form
      layout={{
        title: VEEAM_SUMMARY_TITLE,
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
              history.push(`/accounts/Veeam/buckets/${bucketName}`);
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
            textToCopy={`Username\tveeam\nAccess key ID\t${accessKey}\nSecret Access key\t${secretKey}`}
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
          <Text isEmphazed>{ACCOUNT_SECTION_TITLE}</Text>
          <Table>
            <T.Body>
              <T.Row>
                <T.Key> Service point </T.Key>
                <T.Value> {s3ServicePoint}</T.Value>
                <T.ExtraCell>
                  <Clipboard text={s3ServicePoint} />
                </T.ExtraCell>
              </T.Row>
              <T.Row>
                <T.Key> Region </T.Key>
                <T.Value>{DEFAULT_REGION}</T.Value>
                <T.ExtraCell>
                  <Clipboard text={DEFAULT_REGION} />
                </T.ExtraCell>
              </T.Row>
            </T.Body>
          </Table>
        </Stack>
        <br />
        <Stack direction="vertical" gap="r16">
          <Text isEmphazed>{CREDENTIALS_SECTION_TITLE}</Text>
          <Banner icon={<Icon name="Exclamation-triangle" />} variant="warning">
            The Secret Access key cannot be retrieved afterwards, so make sure
            to keep and secure it now. <br />
            You will be able to create new Access keys at any time.
          </Banner>
          <Table>
            <T.Body>
              <T.Row>
                <T.Key> Access key ID </T.Key>
                <T.Value>{accessKey}</T.Value>
                <T.ExtraCell>
                  <Clipboard text={accessKey} />
                </T.ExtraCell>
              </T.Row>
              <T.Row>
                <T.Key> Secret Access key </T.Key>
                <T.Value>
                  <HideCredential credentials={secretKey} />
                </T.Value>
                <T.ExtraCell>
                  <Clipboard text={secretKey} />
                </T.ExtraCell>
              </T.Row>
            </T.Body>
          </Table>
        </Stack>
        <br />
        <Stack direction="vertical" gap="r16">
          <Text isEmphazed>{BUCKET_SECTION_TITLE}</Text>
          <Table style={{ marginTop: spacing.sp16 }}>
            <T.Body>
              <T.Row>
                <T.Key> Name </T.Key>
                <T.Value>{bucketName}</T.Value>
                <T.ExtraCell>
                  <Clipboard text={bucketName} />
                </T.ExtraCell>
              </T.Row>
              <T.Row>
                <T.Key> Immutable backup </T.Key>
                <T.Value>
                  {enableImmutableBackup ? 'Active' : 'Inactive'}
                  <br />
                  <Text variant="Smaller" color="textSecondary">
                    Make sure to check the "Make recent backups immutable"
                    checkbox when configuring the bucket in the Veeam Server.
                  </Text>
                </T.Value>
              </T.Row>
            </T.Body>
          </Table>
        </Stack>
        <br />
        {isPlatformAdmin ? (
          <Stack direction="vertical" gap="r16">
            <Text isEmphazed>{CERTIFICATE_SECTION_TITLE}</Text>
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
