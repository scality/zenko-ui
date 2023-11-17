import { Banner, Form, Icon, Text } from '@scality/core-ui';
import { Box, Button, CopyButton } from '@scality/core-ui/dist/next';
import { Stack } from '@scality/core-ui/dist/spacing';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useHistory } from 'react-router-dom';
import { Clipboard } from '../Clipboard';
import { HideCredential } from '../Hide';
import Table, * as T from '../TableKeyValue';
import { useTheme } from 'styled-components';

type VeeamSummaryProps = Record<string, never>;

export const VeeamSummary = (_: VeeamSummaryProps) => {
  const history = useHistory();
  const theme = useTheme();
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
    >
      <div
        style={{
          backgroundColor: theme.brand.backgroundLevel3,
          padding: spacing.sp16,
        }}
      >
        <Stack>
          <Text isEmphazed>
            ARTESCA is now ready for Veeam. You can use this data to set up your
            Veeam application.
          </Text>
          <CopyButton
            textToCopy={`Username\tveeam\nAccess key ID\tJLVWC9DX45XLY0K9PVEX\nSecret Access key\tEPJGOdLwTK`}
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
        <b>Information for Veeam Account</b>
        <Table style={{ marginTop: spacing.sp16 }}>
          <T.Body>
            <T.Row>
              <T.Key> Service point </T.Key>
              <T.Value> https://s3.pod-choco.local </T.Value>
              <T.ExtraCell>
                {' '}
                <Clipboard text={'https://s3.pod-choco.local'} />{' '}
              </T.ExtraCell>
            </T.Row>
            <T.Row>
              <T.Key> Region </T.Key>
              <T.Value> us-east-1 </T.Value>
              <T.ExtraCell>
                {' '}
                <Clipboard text={'us-east-1'} />{' '}
              </T.ExtraCell>
            </T.Row>
          </T.Body>
        </Table>
        <Stack direction="vertical">
          <b>Credentials</b>
          <Banner icon={<Icon name="Exclamation-circle" />} variant="warning">
            This Secret Access key cannot be retrieved afterwards, make sure to
            copy it in a safe place now.
          </Banner>
          <Table
            style={{
              marginTop: spacing.sp16,
            }}
          >
            <T.Body>
              <T.Row>
                <T.Key> Access key ID </T.Key>
                <T.Value>JLVWC9DX45XLY0K9PVEX</T.Value>
                <T.ExtraCell>
                  {' '}
                  <Clipboard text={'JLVWC9DX45XLY0K9PVEX'} />{' '}
                </T.ExtraCell>
              </T.Row>
              <T.Row>
                <T.Key> Secret Access key </T.Key>
                <T.Value>
                  {' '}
                  <HideCredential credentials={'EPJGOdLwTK'} />{' '}
                </T.Value>
                <T.ExtraCell>
                  {' '}
                  <Clipboard text={'EPJGOdLwTK'} />{' '}
                </T.ExtraCell>
              </T.Row>
            </T.Body>
          </Table>
        </Stack>
        <b>Bucket</b>
        <br />
        <Table>
          <T.Body>
            <T.Row>
              <T.Key> Name </T.Key>
              <T.Value> veeam-bucket </T.Value>
              <T.ExtraCell>
                {' '}
                <Clipboard text={'veeam-repository'} />{' '}
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
        <Stack direction="vertical">
          <b>Certificate</b>
          <Text color="textSecondary">
            Trust the ARTESCA CA Root on your Veeam server to maintain
            uninterrupted service.
          </Text>
          <Button
            label="Artesca-CA Root"
            variant="secondary"
            icon={<Icon name="Download" />}
            tooltip={{
              overlay:
                'Download the Artesca-CA root certificate and add it to your Veeam Server.',
              placement: 'right',
            }}
          />
        </Stack>
      </div>
    </Form>
  );
};
