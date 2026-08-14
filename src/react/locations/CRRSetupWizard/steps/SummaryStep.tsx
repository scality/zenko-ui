import { Form, FormGroup, FormSection, Text } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { buildCRRLocationName, buildCRRReplicationRuleId } from './ApplyActionsStep/crrLocation';
import type { ConfigureFormValues } from './ConfigureStep/schema';

type Props = Partial<ConfigureFormValues>;

export const SummaryStep = ({
  accountName,
  destinationAccountName,
  baseDomain,
  createReplicationRule,
  sourceBucketName,
  targetBucketName,
}: Props) => {
  const navigate = useBasenameRelativeNavigate();
  const onFinish = () =>
    navigate(
      createReplicationRule && sourceBucketName && accountName
        ? `/accounts/${accountName}/buckets/${sourceBucketName}`
        : '/buckets',
    );
  const locationName = buildCRRLocationName({
    destinationAccountName: destinationAccountName ?? '',
    baseDomain: baseDomain ?? '',
  });

  const intro = createReplicationRule
    ? 'Cross-Region Replication is now configured. New objects added to the source bucket are replicated to the destination automatically.'
    : 'Your Cross-Region Replication location is now ready. You can enable replication on a bucket whenever you need it.';

  const details = [
    { id: 'location-name', label: 'Location Name', value: locationName },
    ...(createReplicationRule
      ? [
          {
            id: 'replication-rule',
            label: 'Replication Rule',
            value: buildCRRReplicationRuleId(destinationAccountName ?? ''),
          },
          { id: 'source-bucket', label: 'Source Bucket', value: sourceBucketName ?? '' },
          { id: 'target-bucket', label: 'Target Bucket', value: targetBucketName ?? '' },
        ]
      : []),
  ];

  return (
    <Form
      layout={{ title: 'Summary', kind: 'page' }}
      requireMode="all"
      rightActions={<Button variant="primary" type="button" label="Finish" onClick={onFinish} />}
    >
      <Text isEmphazed>{intro}</Text>
      <FormSection title={{ name: 'Details' }}>
        {details.map((detail) => (
          <FormGroup
            key={detail.id}
            id={detail.id}
            label={detail.label}
            content={<Text>{detail.value}</Text>}
            required
          />
        ))}
      </FormSection>
    </Form>
  );
};
