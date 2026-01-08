import {
  Form,
  FormGroup,
  FormSection,
  InfoMessage,
  Text,
  Wrap,
} from '@scality/core-ui';
import { Button, CopyButton } from '@scality/core-ui/dist/next';
import { FormData } from '../engine/types';
import styled from 'styled-components';

const WrapperWithWidth = styled(Wrap)`
  width: 20rem;
`;

type VeeamRepositorySummaryProps = {
  formData: FormData;
  onFinish: () => void;
};

export const VeeamRepositorySummary = ({
  formData,
  onFinish,
}: VeeamRepositorySummaryProps) => {
  const { buckets, enableImmutableBackup, immutablePeriodDays } = formData;
  return (
    <Form
      layout={{
        title: 'Veeam Repository creation summary',
        kind: 'page',
      }}
      rightActions={
        <Button
          type="button"
          variant="primary"
          onClick={onFinish}
          label="Exit"
        />
      }
    >
      <Text isEmphazed>
        Veeam repo "{buckets[0].name}" was successfully created on the Veeam
        application.
      </Text>

      <FormSection forceLabelWidth={300}>
        <FormGroup
          id="veeam-repository-name"
          label="Veeam repository name"
          content={
            <WrapperWithWidth>
              <Text>{buckets[0].name}</Text>
              <CopyButton
                textToCopy={buckets[0].name}
                aria-label="copy access key"
              />
            </WrapperWithWidth>
          }
        />

        <>
          <Text variant="Large" isEmphazed>
            Option
          </Text>

          <FormGroup
            id="immutable-backup-status"
            label="Immutable backup"
            labelHelpTooltip={<></>}
            content={
              <Text>{enableImmutableBackup ? 'Active' : 'Inactive'}</Text>
            }
          />

          {enableImmutableBackup && immutablePeriodDays && (
            <FormGroup
              id="veeam-immutable-retention-period"
              label="Veeam Immutable retention period"
              labelHelpTooltip={<></>}
              content={<Text>{`${immutablePeriodDays} day(s)`}</Text>}
            />
          )}
        </>

        <InfoMessage
          title="What is the next step?"
          content={
            <>
              Your repository is now available in VBR under the name "
              {buckets[0].name}". You can now proceed with the creation of your
              backup jobs in the Veeam application.
            </>
          }
        />
      </FormSection>
    </Form>
  );
};
