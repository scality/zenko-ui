import { FormGroup, FormSection } from '@scality/core-ui';
import { Input, Select } from '@scality/core-ui/dist/next';
import { type ChangeEvent, useEffect, useState } from 'react';
import { LocationAwsQueue, type LocationAwsSqsV1, type LocationPollingV1 } from '../../../js/managementClient/api';
import { ColdStorageIconLabel } from '../../ui-elements/ColdStorageIcon';
import { ACCESS_KEY_PLACEHOLDER, LOCATION_EDITOR_FORCED_LABEL_WIDTH, S3_ENDPOINT_PATH_STYLE_TOOLTIP, SECRET_KEY_PLACEHOLDER } from '../LocationEditor';
import type { LocationDetailsFormProps } from '.';
import { type ColdLocationType, isColdLocationType } from './coldLocations';

/**
 * Cold-location form. Generic over the set of cold S3-like locations that
 * share the same backend schema (validateGlacierLocation) and only differ
 * in provider-specific defaults / placeholders.
 *
 * Today: AWS Glacier and Scaleway Glacier.
 * Extensible: OVH Cold Archive, Versity Tape Archive (added in a follow-up PR).
 *
 * The COLD_LOCATION_TYPES registry lives in ./coldLocations so utils.tsx
 * (convertToLocation -> isCold) reads from the same single source.
 */

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

/**
 * Default queue payloads sent to the backend when the user hasn't entered
 * provider-specific fields. `interval` is explicitly `undefined` (not `''`):
 *   - `in` narrowing on `formState.queue` keeps working (the key exists).
 *   - JSON.stringify drops undefined values, so the backend sees a missing
 *     `interval` and uses its server-side default. Sending `''` would be an
 *     invalid duration string per the swagger `format: duration` contract.
 */
const defaultQueuePolling: LocationPollingV1 = {
  type: LocationAwsQueue.TypeEnum.PollingV1,
  interval: undefined,
};

const defaultQueueSqs: LocationAwsSqsV1 = {
  type: LocationAwsQueue.TypeEnum.AwsSqsV1,
  queueUrl: '',
};

/**
 * The generated `<any>`-cast enum can't be passed directly as a `string`
 * prop value, so hoist the stringified queue-type discriminators once
 * and reuse them in JSX + control flow.
 */
const QUEUE_TYPE_POLLING = LocationAwsQueue.TypeEnum.PollingV1.toString();
const QUEUE_TYPE_SQS = LocationAwsQueue.TypeEnum.AwsSqsV1.toString();

const LocationDetailsColdLocation = ({ details, onChange, locationType }: LocationDetailsFormProps) => {
  const provider = isColdLocationType(locationType) ? locationType : 'location-aws-glacier-v1';
  const placeholders = COLD_LOCATION_PLACEHOLDERS[provider];
  const labels = COLD_LOCATION_LABELS[provider];
  const [formState, setFormState] = useState<State>({
    endpoint: '',
    accessKey: '',
    bucketName: '',
    region: '',
    storageClass: '',
    ...details,
    // Never display server-returned credentials, even in edit mode.
    secretKey: '',
    queue:
      details.queue?.type === LocationAwsQueue.TypeEnum.AwsSqsV1
        ? { ...defaultQueueSqs, ...(details.queue as LocationAwsSqsV1) }
        : { ...defaultQueuePolling, ...(details.queue as LocationPollingV1) },
  });

  //TODO check why the tests expect onChange to be called on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: matches LocationDetailsAwsCustom / LocationDetailsOracle
  useEffect(() => {
    onChange(formState);
  }, []);

  const onInternalStateChange = (newStates: [string, string | boolean | object][]) => {
    const newState = newStates.reduce<State>(
      (prev, curr) => {
        const [key, value] = curr;
        return Object.assign({}, prev, { [key]: value });
      },
      { ...formState },
    );
    setFormState(newState);
    onChange(newState);
  };

  const onFormItemChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const value: string | boolean = target.type === 'checkbox' ? target.checked : target.value;
    if (target.name.startsWith('queue.')) {
      const field = target.name.slice('queue.'.length);
      // The polling `interval` field is optional in the API; an empty string
      // is not a valid duration. Drop the key so the backend uses its default.
      const nextValue = field === 'interval' && value === '' ? undefined : value;
      const newQueue = { ...formState.queue, [field]: nextValue } as QueueState;
      onInternalStateChange([['queue', newQueue]]);
      return;
    }
    onInternalStateChange([[target.name, value]]);
  };

  const onChangeQueueType = (newType: string) => {
    if (newType === QUEUE_TYPE_POLLING) {
      onInternalStateChange([['queue', { ...defaultQueuePolling }]]);
    } else if (newType === QUEUE_TYPE_SQS) {
      onInternalStateChange([['queue', { ...defaultQueueSqs }]]);
    }
  };

  const isPolling = formState.queue.type === LocationAwsQueue.TypeEnum.PollingV1;
  const isSqs = formState.queue.type === LocationAwsQueue.TypeEnum.AwsSqsV1;

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
              value={formState.endpoint}
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
              value={formState.accessKey}
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
              value={formState.secretKey}
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
              value={formState.bucketName}
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
              value={formState.region}
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
              value={formState.storageClass}
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
              value={formState.queue.type.toString()}
            >
              <Select.Option value={QUEUE_TYPE_POLLING}>Polling</Select.Option>
              <Select.Option value={QUEUE_TYPE_SQS}>AWS SQS</Select.Option>
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
                value={formState.queue.interval ?? ''}
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
                value={formState.queue.queueUrl}
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
