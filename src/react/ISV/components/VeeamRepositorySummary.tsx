import { InfoMessage, Text } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { Form, FormGroup, FormSection } from '../../ui-elements/CoreUIForm';
import type { FormData } from '../engine/types';
import { CopyableValue } from './shared/CopyableValue';

type VeeamRepositorySummaryProps = {
  formData: FormData;
  onFinish: () => void;
};

export const VeeamRepositorySummary = ({ formData, onFinish }: VeeamRepositorySummaryProps) => {
  const { buckets, enableImmutableBackup, immutablePeriodDays } = formData;
  return (
    <Form
      layout={{
        title: 'Veeam Repository creation summary',
        kind: 'page',
      }}
      rightActions={<Button type="button" variant="primary" onClick={onFinish} label="Exit" />}
      responsive
    >
      <Text isEmphazed>
        {buckets.length === 1
          ? `Veeam repository "${buckets[0].name}" was successfully created in the Veeam application.`
          : `${buckets.length} Veeam repositories were successfully created in the Veeam application.`}
      </Text>

      <FormSection forceLabelWidth="20.5rem">
        <>
          {buckets.map((bucket, index) => (
            <FormGroup
              key={bucket.name}
              id={`veeam-repository-name-${bucket.name}`}
              label={buckets.length > 1 ? `Veeam repository name #${index + 1}` : 'Veeam repository name'}
              content={<CopyableValue value={bucket.name} copyLabel="copy repository name" />}
            />
          ))}
        </>

        <>
          <Text variant="Large" isEmphazed>
            Option
          </Text>

          <FormGroup
            id="immutable-backup-status"
            label="Immutable backup"
            labelHelpTooltip={<></>}
            content={<Text>{enableImmutableBackup ? 'Active' : 'Inactive'}</Text>}
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
              {buckets.length === 1
                ? `Your repository is now available in VBR under the name "${buckets[0].name}". You can now proceed with the creation of your backup jobs in the Veeam application.`
                : `Your ${buckets.length} repositories are now available in VBR. You can now proceed with the creation of your backup jobs in the Veeam application.`}
            </>
          }
        />
      </FormSection>
    </Form>
  );
};
