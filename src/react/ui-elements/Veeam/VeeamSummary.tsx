import { Banner, Form, Icon, Text } from '@scality/core-ui';
import { Button, CopyButton } from '@scality/core-ui/dist/next';
import { Stack } from '@scality/core-ui/dist/spacing';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useHistory } from 'react-router-dom';
import { Clipboard } from '../Clipboard';
import { HideCredential } from '../Hide';
import { ModalBody } from '../Modal';
import Table, * as T from '../TableKeyValue';

type VeeamSummaryProps = Record<string, never>;

export const VeeamSummary = (_: VeeamSummaryProps) => {
  const history = useHistory();

  return (
    <Form
      layout={{
        title: 'Veeam Repository preparation summary',
        kind: 'page',
      }}
      rightActions={
        <Stack gap="r16">
          <p></p>
          <Button
            variant="primary"
            label={'Continue'}
            onClick={() => {
              history.push('/');
            }}
          />
        </Stack>
      }
    >
      <ModalBody>
        <Text isEmphazed>
          The following configuration has been applied in order to make ARTESCA
          ready for Veeam. <br />
          You can now use this information to set up the Veeam Server.
        </Text>{' '}
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
        <br />
        <Table style={{ marginTop: spacing.sp16 }}>
          <T.Body>
            <T.Row>
              <T.Key> Account name </T.Key>
              <T.Value> veeam </T.Value>
            </T.Row>
            <T.Row>
              <T.Key> Certificate </T.Key>
              <T.Value>
                <Button
                  label="Artesca-CA Root"
                  variant="outline"
                  size="inline"
                  icon={<Icon name="Download" />}
                  tooltip={{
                    overlay:
                      'Download the Artesca-CA root certificate and add it to your Veeam Server.',
                    placement: 'right',
                  }}
                ></Button>{' '}
              </T.Value>
            </T.Row>
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
        <br />
        <b>Credentials</b>
        <br />
        <br />
        <Banner icon={<Icon name="Exclamation-triangle" />} variant="warning">
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
        <br />
        <b>Bucket</b>
        <br />
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
      </ModalBody>
    </Form>
  );
};
