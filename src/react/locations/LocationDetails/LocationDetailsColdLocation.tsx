import { FormGroup, FormSection } from '@scality/core-ui';
import { Input, Select } from '@scality/core-ui/dist/next';
import lodashSet from 'lodash.set';
import { useState } from 'react';
import { LocationAwsQueue, type LocationAwsSqsV1, type LocationPollingV1 } from '../../../js/managementClient/api';
import { ColdStorageIconLabel } from '../../ui-elements/ColdStorageIcon';
import { ACCESS_KEY_PLACEHOLDER, LOCATION_EDITOR_FORCED_LABEL_WIDTH, S3_ENDPOINT_PATH_STYLE_TOOLTIP, SECRET_KEY_PLACEHOLDER } from '../LocationEditor';
import type { LocationDetailsFormProps } from '.';

/**
 * Cold-location form. Generic over the set of cold S3-like locations that
 * share the same backend schema (validateGlacierLocation) and only differ
 * in provider-specific defaults / placeholders.
 *
 * Today: AWS Glacier and Scaleway Glacier.
 * Extensible: OVH Cold Archive, Versity Tape Archive (added in a follow-up PR).
 */
const COLD_LOCATION_TYPES = ['location-aws-glacier-v1', 'location-scaleway-glacier-v1'] as const;
type ColdLocationType = (typeof COLD_LOCATION_TYPES)[number];

/** Provider-specific placeholders */
const COLD_LOCATION_PLACEHOLDERS: Record<
  ColdLocationType,
  { endpoint: string; region: string; storageClass: string }
> = {
  'location-aws-glacier-v1': {
    endpoint: 'https://s3.region.amazonaws.com',
    region: 'us-east-1',
    storageClass: 'GLACIER',
  },
  'location-scaleway-glacier-v1': {
    endpoint: 'https://s3.fr-par.scw.cloud',
    region: 'fr-par',
    storageClass: 'GLACIER',
  },
};

/** Provider-specific labels */
const COLD_LOCATION_LABELS: Record<
  ColdLocationType,
  { accessKey: string; secretKey: string; bucketName: string }
> = {
  'location-aws-glacier-v1': {
    accessKey: 'AWS Access Key',
    secretKey: 'AWS Secret Key',
    bucketName: 'Target Bucket Name',
  },
  'location-scaleway-glacier-v1': {
    accessKey: 'Scaleway Access Key',
    secretKey: 'Scaleway Secret Key',
    bucketName: 'Target Bucket Name',
  },
};

type QueueState = LocationPollingV1 | LocationAwsSqsV1;

type State = {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  region: string;
  storageClass: string;
  queue: QueueState;
};

const defaultQueuePolling: LocationPollingV1 = {
  type: LocationAwsQueue.TypeEnum.PollingV1,
  interval: '',
};

const defaultQueueSqs: LocationAwsSqsV1 = {
  type: LocationAwsQueue.TypeEnum.AwsSqsV1,
  queueUrl: '',
};

const LocationDetailsColdLocation = ({ details, onChange, locationType }: LocationDetailsFormProps) => {
  const provider = COLD_LOCATION_TYPES.includes(locationType as ColdLocationType)
    ? (locationType as ColdLocationType)
    : 'location-aws-glacier-v1';
  const placeholders = COLD_LOCATION_PLACEHOLDERS[provider];
  const labels = COLD_LOCATION_LABELS[provider];
  const [formState, setFormState] = useState<State>({
    endpoint: '',
    accessKey: '',
    secretKey: '',
    bucketName: '',
    region: '',
    storageClass: '',
    queue: {
      ...defaultQueuePolling,
      ...(details.queue as QueueState),
    },
    ...details,
  });

  const onInternalStateChange = (newStates: [string, string | boolean | object][]) => {
    const newState = newStates.reduce<State>(
      (prev, curr) => {
        const [key, value] = curr;
        return Object.assign({}, prev, { [key]: value });
      },
      { ...formState },
    );
    setFormState(newState);
    if (onChange) {
      onChange(newState);
    }
  };

  const onFormItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const value: string | boolean | object = target.type === 'checkbox' ? target.checked : target.value;
    let targetName = target.name;
    if (target.name.includes('.')) {
      targetName = target.name.split('.')[0];
      if (targetName === 'queue') {
        const newState = { ...formState };
        lodashSet(newState, target.name, value);
        onInternalStateChange([['queue', newState.queue]]);
        return;
      }
    }
    onInternalStateChange([[targetName, value]]);
  };

  const onChangeQueueType = (newType: string) => {
    if (newType === 'location-polling-v1') {
      onInternalStateChange([['queue', { ...defaultQueuePolling }]]);
    } else if (newType === 'location-aws-sqs-v1') {
      onInternalStateChange([['queue', { ...defaultQueueSqs }]]);
    }
  };

  const isPolling = formState.queue?.type === LocationAwsQueue.TypeEnum.PollingV1;
  const isSqs = formState.queue?.type === LocationAwsQueue.TypeEnum.AwsSqsV1;

  return (
    <>
      <FormSection forceLabelWidth={LOCATION_EDITOR_FORCED_LABEL_WIDTH}>
        <FormGroup id="temperature" label="Temperature" helpErrorPosition="bottom" content={<ColdStorageIconLabel />} />
        <FormGroup
          id="endpoint"
          label="Endpoint"
          labelHelpTooltip={S3_ENDPOINT_PATH_STYLE_TOOLTIP}
          helpErrorPosition="bottom"
          content={
            <Input
              name="endpoint"
              id="endpoint"
              type="text"
              placeholder={placeholders.endpoint}
              value={formState.endpoint || ''}
              onChange={onFormItemChange}
              autoComplete="off"
            />
          }
        />
        <FormGroup
          id="accessKey"
          label={labels.accessKey}
          required
          helpErrorPosition="bottom"
          content={
            <Input
              name="accessKey"
              id="accessKey"
              type="text"
              placeholder={ACCESS_KEY_PLACEHOLDER}
              value={formState.accessKey || ''}
              onChange={onFormItemChange}
              autoComplete="off"
            />
          }
        />
        <FormGroup
          id="secretKey"
          label={labels.secretKey}
          required
          helpErrorPosition="bottom"
          labelHelpTooltip="Your credentials are encrypted in transit and at rest."
          content={
            <Input
              name="secretKey"
              id="secretKey"
              type="password"
              placeholder={SECRET_KEY_PLACEHOLDER}
              value={formState.secretKey || ''}
              onChange={onFormItemChange}
              autoComplete="new-password"
            />
          }
        />
        <FormGroup
          id="bucketName"
          label={labels.bucketName}
          required
          helpErrorPosition="bottom"
          content={
            <Input
              name="bucketName"
              id="bucketName"
              type="text"
              placeholder="Bucket Name"
              value={formState.bucketName || ''}
              onChange={onFormItemChange}
              autoComplete="off"
            />
          }
        />
        <FormGroup
          id="region"
          label="Region"
          helpErrorPosition="bottom"
          content={
            <Input
              name="region"
              id="region"
              type="text"
              placeholder={placeholders.region}
              value={formState.region || ''}
              onChange={onFormItemChange}
              autoComplete="off"
            />
          }
        />
        <FormGroup
          id="storageClass"
          label="Storage class"
          helpErrorPosition="bottom"
          content={
            <Input
              name="storageClass"
              id="storageClass"
              type="text"
              placeholder={placeholders.storageClass}
              value={formState.storageClass || ''}
              onChange={onFormItemChange}
              autoComplete="off"
            />
          }
        />
      </FormSection>
      <FormSection title={{ name: 'Queue' }} forceLabelWidth={LOCATION_EDITOR_FORCED_LABEL_WIDTH}>
        <FormGroup
          id="queue.type"
          label="Queue type"
          helpErrorPosition="bottom"
          required
          content={
            <Select
              id="queue.type"
              placeholder="Select an option..."
              onChange={onChangeQueueType}
              value={formState.queue?.type?.toString() ?? 'location-polling-v1'}
            >
              <Select.Option value="location-polling-v1">Polling</Select.Option>
              <Select.Option value="location-aws-sqs-v1">AWS SQS</Select.Option>
            </Select>
          }
        />
        {isPolling && 'interval' in formState.queue && (
          <FormGroup
            id="queue.interval"
            label="Polling interval"
            helpErrorPosition="bottom"
            content={
              <Input
                name="queue.interval"
                id="queue.interval"
                type="text"
                placeholder="e.g. 5m"
                value={formState.queue.interval || ''}
                onChange={onFormItemChange}
                autoComplete="off"
              />
            }
          />
        )}
        {isSqs && 'queueUrl' in formState.queue && (
          <FormGroup
            id="queue.queueUrl"
            label="SQS Queue URL"
            required
            helpErrorPosition="bottom"
            content={
              <Input
                name="queue.queueUrl"
                id="queue.queueUrl"
                type="text"
                placeholder="https://sqs.region.amazonaws.com/account-id/queue-name"
                value={formState.queue.queueUrl || ''}
                onChange={onFormItemChange}
                autoComplete="off"
              />
            }
          />
        )}
      </FormSection>
    </>
  );
};

export default LocationDetailsColdLocation;
