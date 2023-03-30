import { useState } from 'react';
import lodashSet from 'lodash.set';
import { FormGroup, FormSection } from '@scality/core-ui';
import { Select, Input } from '@scality/core-ui/dist/next';

import { LocationDetailsFormProps } from '.';
import {
  LocationAzureServicebusQueueV1,
  LocationAzureServicebusTopicV1,
  LocationAzureStorageQueueV1,
  LocationAzureQueue,
  LocationAzureClientSecret,
  LocationAzureSharedAccessSignature,
  LocationAzureSharedKey,
  LocationAzureAuth,
} from '../../../../js/managementClient/api';
import { ColdStorageIconLabel } from '../../../ui-elements/ColdStorageIcon';

type State = {
  endpoint: string;
  bucketName: string;
  queue:
    | LocationAzureServicebusTopicV1
    | LocationAzureServicebusQueueV1
    | LocationAzureStorageQueueV1;

  auth:
    | LocationAzureClientSecret
    | LocationAzureSharedAccessSignature
    | LocationAzureSharedKey;
};

const LocationDetailsAzureArchive = ({
  details,
  onChange,
}: LocationDetailsFormProps) => {
  const [formState, setFormState] = useState<State>({
    endpoint: '',
    bucketName: '',
    ...details,
    queue: {
      type: LocationAzureQueue.TypeEnum['ServicebusTopicV1'],
      topicName: '',
      topicSubscriptionId: '',
      // Optional field
      namespace: '',
      ...details.queue,
    },
    auth: {
      type: LocationAzureAuth.TypeEnum['ClientSecret'],
      tenantId: '',
      clientId: '',
      clientKey: '',
      ...details.auth,
    },
  });

  // This function mostly help set `formState.queue` and `formState.auth`
  const onInternalStateChange = (
    newStates: [string, string | boolean | object][],
  ) => {
    const newState = newStates.reduce(
      (prev, curr) => {
        const [key, value] = curr;
        return { ...prev, [key]: value };
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
    let value: string | boolean | object =
      target.type === 'checkbox' ? target.checked : target.value;
    let targetName = target.name;

    if (target.name.includes('.')) {
      targetName = target.name.split('.')[0];
      if (targetName === 'auth' || targetName === 'queue') {
        const newState = formState;
        lodashSet(newState, target.name, value);
        value = newState[targetName];
      }
    }

    onInternalStateChange([[targetName, value]]);
  };

  const onChangeQueueType = (newType: string) => {
    if (newType === 'location-azure-servicebus-topic-v1') {
      onInternalStateChange([
        [
          'queue',
          {
            type: newType,
            topicName: '',
            topicSubscriptionId: '',
            // Optional field
            namespace: '',
          },
        ],
        [
          'auth',
          {
            type: 'location-azure-client-secret',
            clientId: '',
            clientKey: '',
          },
        ],
      ]);
    } else if (newType === 'location-azure-servicebus-queue-v1') {
      onInternalStateChange([
        [
          'queue',
          {
            type: newType,
            queueName: '',
            endpoint: '',
          },
        ],
        [
          'auth',
          {
            type: 'location-azure-client-secret',
            clientId: '',
            clientKey: '',
          },
        ],
      ]);
    } else if (newType === 'location-azure-storage-queue-v1') {
      onInternalStateChange([
        [
          'queue',
          {
            type: newType,
            queueName: '',
            // Optional field
            endpoint: '',
          },
        ],
      ]);
    }
  };

  const onAuthTypeChange = (newType: string) => {
    switch (newType) {
      case 'location-azure-shared-key':
        onInternalStateChange([
          [
            'auth',
            {
              type: 'location-azure-shared-key',
              accountName: '',
              accountKey: '',
            },
          ],
        ]);
        return;
      case 'location-azure-client-secret':
        onInternalStateChange([
          [
            'auth',
            {
              type: 'location-azure-client-secret',
              clientId: '',
              clientKey: '',
            },
          ],
        ]);
        return;
      case 'location-azure-shared-access-signature':
        onInternalStateChange([
          [
            'auth',
            {
              type: 'location-azure-shared-access-signature',
              storageSasToken: '',
            },
          ],
        ]);
        return;
    }
  };

  const isServiceBus =
    formState.queue.type === LocationAzureQueue.TypeEnum['ServicebusTopicV1'] ||
    formState.queue.type === LocationAzureQueue.TypeEnum['ServicebusQueueV1'];

  return (
    <>
      <FormSection forceLabelWidth={210}>
        <FormGroup
          id="temperature"
          label="Temperature"
          helpErrorPosition="bottom"
          content={<ColdStorageIconLabel />}
        />
        <FormGroup
          id="endpoint"
          label="Blob Endpoint"
          required
          helpErrorPosition="bottom"
          content={
            <Input
              name="endpoint"
              id="endpoint"
              type="text"
              placeholder="https://scality.blob.windows.net"
              value={formState.endpoint}
              onChange={onFormItemChange}
              autoComplete="off"
            />
          }
        />
        <FormGroup
          id="bucketName"
          label="Target Azure Container Name"
          required
          helpErrorPosition="bottom"
          content={
            <Input
              name="bucketName"
              id="bucketName"
              type="text"
              placeholder="Container Name"
              value={formState.bucketName}
              autoComplete="off"
              onChange={onFormItemChange}
            />
          }
        />
      </FormSection>
      <FormSection title={{ name: 'Queue' }} forceLabelWidth={210}>
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
              <Select.Option value={'location-azure-servicebus-topic-v1'}>
                Azure Service Bus Topic
              </Select.Option>
              <Select.Option value={'location-azure-servicebus-queue-v1'}>
                Azure Service Bus Queue
              </Select.Option>
              <Select.Option value={'location-azure-storage-queue-v1'}>
                Azure Storage Queue
              </Select.Option>
            </Select>
          }
        />
        {formState.queue.type ===
          LocationAzureQueue.TypeEnum['ServicebusTopicV1'] &&
        'topicName' in formState.queue ? (
          <>
            <FormGroup
              id="queue.topicName"
              label="Topic Name"
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="queue.topicName"
                  id="queue.topicName"
                  type="text"
                  placeholder="topic-name"
                  value={formState.queue.topicName}
                  autoComplete="off"
                  onChange={onFormItemChange}
                />
              }
            />
            <FormGroup
              id="queue.topicSubscriptionId"
              label="Topic Subscription ID"
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="queue.topicSubscriptionId"
                  id="queue.topicSubscriptionId"
                  type="text"
                  placeholder="topic-subscription-id"
                  value={formState.queue.topicSubscriptionId}
                  autoComplete="off"
                  onChange={onFormItemChange}
                />
              }
            />
            <FormGroup
              id="queue.namespace"
              label="Service Bus Endpoint"
              helpErrorPosition="bottom"
              labelHelpTooltip={
                <>
                  {
                    'https://<<ServiceBusNamespace>>.servicebus.windows.net is usually used as the Storage queue endpoint.'
                  }
                  <br />
                  <br />
                  It will be derived from the Service Bus namespace if not
                  explicitely provided.
                </>
              }
              required
              content={
                <Input
                  name="queue.namespace"
                  id="queue.namespace"
                  type="text"
                  placeholder="account-name.storage.windows.net"
                  value={formState.queue.namespace}
                  autoComplete="off"
                  onChange={onFormItemChange}
                />
              }
            />
          </>
        ) : (
          <></>
        )}

        {formState.queue.type ===
          LocationAzureQueue.TypeEnum['ServicebusQueueV1'] &&
        'queueName' in formState.queue &&
        'endpoint' in formState.queue ? (
          <>
            <FormGroup
              label="Queue Name"
              id="queue.queueName"
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="queue.queueName"
                  id="queue.queueName"
                  type="text"
                  placeholder="queue-name"
                  value={formState.queue.queueName}
                  autoComplete="off"
                  onChange={onFormItemChange}
                />
              }
            />
            <FormGroup
              label="Service Bus Endpoint"
              id="queue.endpoint"
              helpErrorPosition="bottom"
              labelHelpTooltip={
                <>
                  {
                    'https://<<ServiceBusNamespace>>.servicebus.windows.net is usually used as the Storage queue endpoint.'
                  }
                  <br />
                  <br />
                  It will be derived from the Service Bus namespace if not
                  explicitely provided.
                </>
              }
              required
              content={
                <Input
                  name="queue.endpoint"
                  id="queue.endpoint"
                  type="text"
                  placeholder="https://mybus.servicebus.windows.net"
                  value={formState.queue.endpoint}
                  autoComplete="off"
                  onChange={onFormItemChange}
                />
              }
            />
          </>
        ) : (
          <></>
        )}

        {formState.queue.type ===
          LocationAzureQueue.TypeEnum['StorageQueueV1'] &&
        'endpoint' in formState.queue ? (
          <>
            <FormGroup
              label="Queue Name"
              id="queue.queueName"
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="queue.queueName"
                  id="queue.queueName"
                  type="text"
                  placeholder="queue-name"
                  value={formState.queue.queueName}
                  autoComplete="off"
                  onChange={onFormItemChange}
                />
              }
            />
            <FormGroup
              label="Queue Endpoint"
              id="queue.endpoint"
              helpErrorPosition="bottom"
              labelHelpTooltip={
                <>
                  {
                    'https://<<StorageaccountName>>.queue.core.windows.net is usually used as the Storage queue endpoint.'
                  }
                  <br />
                  <br />
                  It will be derived from the storage account name if not
                  explicitely provided.
                </>
              }
              content={
                <Input
                  name="queue.endpoint"
                  id="queue.endpoint"
                  type="text"
                  placeholder="account-name.storage.windows.net"
                  value={formState.queue.endpoint}
                  autoComplete="off"
                  onChange={onFormItemChange}
                />
              }
            />
          </>
        ) : (
          <></>
        )}
      </FormSection>
      <FormSection title={{ name: 'Authentication' }} forceLabelWidth={210}>
        <FormGroup
          id="auth"
          label="Authentication type"
          helpErrorPosition="bottom"
          required
          content={
            <Select
              id="auth"
              placeholder="Select an option..."
              onChange={onAuthTypeChange}
              value={formState.auth.type.toString()}
            >
              <Select.Option value={'location-azure-client-secret'}>
                Azure Client Secret
              </Select.Option>
              <Select.Option value={'location-azure-shared-access-signature'}>
                Azure Shared Access Signature
              </Select.Option>
              <Select.Option
                disabled={isServiceBus}
                value={'location-azure-shared-key'}
              >
                Azure Shared Key
              </Select.Option>
            </Select>
          }
        />
        {'accountName' in formState.auth &&
        formState.auth.type === LocationAzureAuth.TypeEnum['SharedKey'] ? (
          <>
            <FormGroup
              label="Azure Account Name"
              id="auth.accountName"
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="auth.accountName"
                  id="auth.accountName"
                  type="text"
                  placeholder="account-name"
                  value={formState.auth.accountName}
                  autoComplete="off"
                  onChange={onFormItemChange}
                />
              }
            />
            <FormGroup
              id="auth.accountKey"
              label="Azure Account Key"
              labelHelpTooltip="Your credentials are encrypted in transit, then at rest using your
            instance's RSA key pair so that we're unable to see them."
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="auth.accountKey"
                  id="auth.accountKey"
                  type="password"
                  placeholder="accountKey"
                  value={formState.auth.accountKey}
                  autoComplete="new-password"
                  onChange={onFormItemChange}
                />
              }
            />
          </>
        ) : (
          <></>
        )}

        {'clientId' in formState.auth &&
        formState.auth.type === LocationAzureAuth.TypeEnum['ClientSecret'] ? (
          <>
            <FormGroup
              label="Tenant ID"
              id="auth.tenantId"
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="auth.tenantId"
                  id="auth.tenantId"
                  type="text"
                  placeholder="tenant-id"
                  value={formState.auth.tenantId}
                  autoComplete="off"
                  onChange={onFormItemChange}
                />
              }
            />
            <FormGroup
              label="Azure Client ID"
              id="auth.clientId"
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="auth.clientId"
                  id="auth.clientId"
                  type="text"
                  placeholder="client-id"
                  value={formState.auth.clientId}
                  autoComplete="off"
                  onChange={onFormItemChange}
                />
              }
            />
            <FormGroup
              id="auth.clientKey"
              label="Azure Client Key"
              labelHelpTooltip="Your credentials are encrypted in transit, then at rest using your instance's RSA key pair so that we're unable to see them."
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="auth.clientKey"
                  id="auth.clientKey"
                  type="password"
                  placeholder="clientKey"
                  value={formState.auth.clientKey}
                  autoComplete="new-password"
                  onChange={onFormItemChange}
                />
              }
            />
          </>
        ) : (
          <></>
        )}

        {'storageSasToken' in formState.auth &&
        formState.auth.type ===
          LocationAzureAuth.TypeEnum['SharedAccessSignature'] ? (
          <>
            <FormGroup
              label="SAS token for Storage"
              labelHelpTooltip="Your credentials are encrypted in transit, then at rest using your
            instance's RSA key pair so that we're unable to see them."
              id="auth.storageSasToken"
              helpErrorPosition="bottom"
              required
              content={
                <Input
                  name="auth.storageSasToken"
                  id="auth.storageSasToken"
                  type="text"
                  placeholder="storage-sas-token"
                  value={formState.auth.storageSasToken}
                  autoComplete="off"
                  onChange={onFormItemChange}
                />
              }
            />
            {isServiceBus ? (
              <FormGroup
                label="SAS token for ServiceBus"
                labelHelpTooltip="Your credentials are encrypted in transit, then at rest using your
            instance's RSA key pair so that we're unable to see them."
                id="auth.serviceBusSasToken"
                helpErrorPosition="bottom"
                required
                content={
                  <Input
                    name="auth.serviceBusSasToken"
                    id="auth.serviceBusSasToken"
                    type="text"
                    placeholder="servicebus-sas-token"
                    value={formState.auth.serviceBusSasToken}
                    autoComplete="off"
                    onChange={onFormItemChange}
                  />
                }
              />
            ) : null}
          </>
        ) : (
          <></>
        )}
      </FormSection>
    </>
  );
};

export default LocationDetailsAzureArchive;
