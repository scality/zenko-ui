import {
  Form,
  FormGroup,
  FormSection,
  InfoMessage,
  Text,
} from '@scality/core-ui';
import { Button, CopyButton } from '@scality/core-ui/dist/next';
import { useMemo } from 'react';
import { VeeamRepositoryData } from '../types';
import { WrapperWithWidth } from './ISVSummary';

type VeeamRepositorySummaryProps = {
  repositoryData: VeeamRepositoryData;
  onFinish: () => void;
};

export const VeeamRepositorySummary = ({
  repositoryData,
  onFinish,
}: VeeamRepositorySummaryProps) => {
  const successMessage = useMemo(() => {
    if (repositoryData.status === 'success') {
      return `Veeam repo "${repositoryData.repositoryName}" was successfully created on the Veeam application.`;
    }
    return 'Veeam repository creation encountered an issue.';
  }, [repositoryData.status, repositoryData.repositoryName]);

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
      <Text isEmphazed>{successMessage}</Text>

      <FormSection forceLabelWidth={300}>
        <FormGroup
          id="veeam-repository-name"
          label="Veeam repository name"
          content={
            <WrapperWithWidth>
              <Text>{repositoryData.repositoryName}</Text>
              <CopyButton
                textToCopy={repositoryData.repositoryName}
                aria-label="copy access key"
              />
            </WrapperWithWidth>
          }
        />

        {repositoryData.status === 'success' && (
          <FormSection forceLabelWidth={200}>
            <Text variant="Large" isEmphazed>
              Option
            </Text>

            <FormGroup
              id="immutable-backup-status"
              label="Immutable backup"
              labelHelpTooltip={<></>}
              content={
                <Text>{repositoryData.immutable ? 'Active' : 'Inactive'}</Text>
              }
            />

            {repositoryData.immutable && repositoryData.immutablePeriodDays && (
              <FormGroup
                id="veeam-immutable-retention-period"
                label="Veeam Immutable retention period"
                labelHelpTooltip={<></>}
                content={
                  <Text>{`${repositoryData.immutablePeriodDays} days`}</Text>
                }
              />
            )}
          </FormSection>
        )}

        <InfoMessage
          title="What is the next step?"
          content={
            <>
              Your repository is now available in VBR under the name "
              {repositoryData.repositoryName}". You can now proceed with the
              creation of your backup jobs in the Veeam application.
            </>
          }
        />
      </FormSection>
    </Form>
  );
};
