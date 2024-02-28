import { fireEvent, getByLabelText, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Locationv1Details } from '../../../../js/managementClient/api';
import { renderWithCustomRoute } from '../../../utils/testUtil';
import LocationDetailsAzureArchive from '../LocationDetailsAzureArchive';

const setupAndRenderLocationDetails = (details?: Locationv1Details) => {
  const onChange = jest.fn();
  const { container } = renderWithCustomRoute(
    <LocationDetailsAzureArchive
      locationType="location-azure-archive-v1"
      details={details || {}}
      onChange={onChange}
    />,
    '/',
  );
  const endpoint = 'https://ep';
  const targetBucket = 'targetBucket';
  return { onChange, container, endpoint, targetBucket };
};

type queueType =
  | 'location-azure-servicebus-topic-v1'
  | 'location-azure-servicebus-queue-v1'
  | 'location-azure-storage-queue-v1';
const selectQueueTypeHelper = (queue: queueType, container: HTMLElement) => {
  const selector = getByLabelText(container, /Queue type \*/i);
  fireEvent.keyDown(selector, {
    key: 'ArrowDown',
    which: 40,
    keyCode: 40,
  });
  if (queue === 'location-azure-servicebus-queue-v1') {
    fireEvent.keyDown(selector, {
      key: 'ArrowDown',
      which: 40,
      keyCode: 40,
    });
  }
  if (queue === 'location-azure-storage-queue-v1') {
    fireEvent.keyDown(selector, {
      key: 'ArrowDown',
      which: 40,
      keyCode: 40,
    });
    fireEvent.keyDown(selector, {
      key: 'ArrowDown',
      which: 40,
      keyCode: 40,
    });
  }

  fireEvent.keyDown(selector, {
    key: 'Enter',
    which: 13,
    keyCode: 13,
  });
};

type authType =
  | 'location-azure-client-secret'
  | 'location-azure-shared-access-signature'
  | 'location-azure-shared-key';
const selectAuthenticationHelper = (auth: authType, container: HTMLElement) => {
  const selector = getByLabelText(container, /Authentication type \*/i);
  fireEvent.keyDown(selector, {
    key: 'ArrowDown',
    which: 40,
    keyCode: 40,
  });

  if (auth === 'location-azure-shared-access-signature') {
    fireEvent.keyDown(selector, {
      key: 'ArrowDown',
      which: 40,
      keyCode: 40,
    });
  } else if (auth === 'location-azure-shared-key') {
    fireEvent.keyDown(selector, {
      key: 'ArrowDown',
      which: 40,
      keyCode: 40,
    });
    fireEvent.keyDown(selector, {
      key: 'ArrowDown',
      which: 40,
      keyCode: 40,
    });
  }
  fireEvent.keyDown(selector, {
    key: 'Enter',
    which: 13,
    keyCode: 13,
  });
};

const azureArchiveCommonHelper = async (
  container: HTMLElement,
  endpoint: string,
  targetBucket: string,
) => {
  await userEvent.type(getByLabelText(container, 'Blob Endpoint *'), endpoint);
  await userEvent.type(
    getByLabelText(container, /Target Azure Container Name \*/i),
    targetBucket,
  );
};

type prefilledValues = [RegExp, string][];
const prefilledHelper = async (
  container: HTMLElement,
  values: prefilledValues,
) => {
  for (let value of values) {
    await userEvent.type(getByLabelText(container, value[0]), value[1]);
  }

  values.forEach((v) => {
    expect(getByLabelText(container, v[0])).toHaveValue(v[1]);
  });
};

const serviceBusTopicHelper = async (container: HTMLElement) => {
  const preDefinedAzureServiceBusTopic: [RegExp, string][] = [
    [/Topic Name \*/, 'mock-topic-name'],
    [/Topic Subscription Name \*/, 'mock-subscription-name'],
    [/Service Bus Endpoint \*/, 'mock-namespace'],
  ];
  await prefilledHelper(container, preDefinedAzureServiceBusTopic);
};

const serviceBusQueueHelper = async (container: HTMLElement) => {
  const preDefinedAzureServiceBusTopic: [RegExp, string][] = [
    [/Queue Name \*/, 'mock-queue-name'],
    [/Service Bus Endpoint \*/, 'mock-endpoint'],
  ];
  await prefilledHelper(container, preDefinedAzureServiceBusTopic);
};

const storageQueueHelper = async (container: HTMLElement) => {
  const preDefinedAzureServiceBusTopic: [RegExp, string][] = [
    [/Queue Name \*/, 'mock-queue-name'],
    [/Queue Endpoint/, 'mock-endpoint'],
  ];
  await prefilledHelper(container, preDefinedAzureServiceBusTopic);
};

const authClientSecretHelper = async (container: HTMLElement) => {
  const values: [RegExp, string][] = [
    [/Tenant ID \*/, 'mock-tenant-id'],
    [/Azure Client ID \*/, 'mock-azure-client-id'],
    [/Azure Client Key \*/, 'mock-azure-client-key'],
  ];
  await prefilledHelper(container, values);
};

const authSharedAccessSignature = async (
  container: HTMLElement,
  isServiceBus = false,
) => {
  const values: [RegExp, string][] = [
    [/SAS token for Storage \*/, 'mock-sas-token-for-storage'],
  ];

  if (isServiceBus) {
    values.push([
      /SAS token for ServiceBus * \*/,
      'mock-sas-token-for-service-bus',
    ]);
  }
  await prefilledHelper(container, values);
};

const authSharedKey = async (container: HTMLElement) => {
  const values: [RegExp, string][] = [
    [/Azure Account Name \*/, 'mock-azure-account-name'],
    [/Azure Account Key \*/, 'mock-azure-account-key'],
  ];
  await prefilledHelper(container, values);
};

describe('<LocationDetailsAzureArchive />', () => {
  it('should show azure details for empty details', () => {
    //S
    setupAndRenderLocationDetails();

    //V
    const textGrep = [
      /Service Bus Endpoint \*/i,
      /target azure container name \*/i,
      /Queue type \*/i,
      /Topic Name \*/i,
      /topic subscription name \*/i,
      /Service Bus Endpoint */i,
      /Authentication type \*/i,
      /Tenant ID \*/i,
      /Azure Client ID \*/i,
      /Azure Client Key \*/i,
    ];

    textGrep.forEach((text) => {
      expect(screen.getByLabelText(text)).toBeInTheDocument();
      expect(screen.getByLabelText(text)).toHaveValue('');
    });
  });

  test('Azure Service Bus Topic should not be able to select Azure Shared Key', async () => {
    // S
    const { container } = setupAndRenderLocationDetails();
    selectQueueTypeHelper('location-azure-servicebus-topic-v1', container);

    // E
    const selector = getByLabelText(container, /Authentication type \*/i);

    fireEvent.keyDown(selector, {
      key: 'ArrowDown',
      which: 40,
      keyCode: 40,
    });

    // V
    expect(
      screen.getByRole('option', {
        name: /Azure Shared Key/i,
      }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  test('Azure Service Bus Queue should not be able to select Azure Shared Key', () => {
    // S
    const { container } = setupAndRenderLocationDetails();
    selectQueueTypeHelper('location-azure-servicebus-queue-v1', container);

    // E
    const selector = getByLabelText(container, /Authentication type \*/i);
    fireEvent.keyDown(selector, {
      key: 'ArrowDown',
      which: 40,
      keyCode: 40,
    });

    // V
    expect(
      screen.getByRole('option', {
        name: /Azure Shared Key/i,
      }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  test('Azure Service Bus Topic + Client Secret', async () => {
    // S
    const { container, onChange, endpoint, targetBucket } =
      setupAndRenderLocationDetails();

    // E + V
    await azureArchiveCommonHelper(container, endpoint, targetBucket);

    await serviceBusTopicHelper(container);

    await authClientSecretHelper(container);
    // V
    expect(onChange).toHaveBeenCalledWith({
      bucketName: targetBucket,
      endpoint,
      queue: {
        type: 'location-azure-servicebus-topic-v1',
        topicName: 'mock-topic-name',
        topicSubscriptionId: 'mock-subscription-name',
        namespace: 'mock-namespace',
      },
      auth: {
        type: 'location-azure-client-secret',
        tenantId: 'mock-tenant-id',
        clientId: 'mock-azure-client-id',
        clientKey: 'mock-azure-client-key',
      },
    });
  });

  test('Azure Service Bus Topic + Shared Access Signature', async () => {
    // S
    const { container, onChange, endpoint, targetBucket } =
      setupAndRenderLocationDetails();
    // E + V

    await azureArchiveCommonHelper(container, endpoint, targetBucket);

    await serviceBusTopicHelper(container);

    selectAuthenticationHelper(
      'location-azure-shared-access-signature',
      container,
    );

    await authSharedAccessSignature(container, true);

    expect(onChange).toHaveBeenCalledWith({
      bucketName: targetBucket,
      endpoint,
      queue: {
        type: 'location-azure-servicebus-topic-v1',
        topicName: 'mock-topic-name',
        topicSubscriptionId: 'mock-subscription-name',
        namespace: 'mock-namespace',
      },
      auth: {
        type: 'location-azure-shared-access-signature',
        storageSasToken: 'mock-sas-token-for-storage',
        serviceBusSasToken: 'mock-sas-token-for-service-bus',
      },
    });
  });

  test('Azure Service Bus Queue + Client Secret', async () => {
    // S
    const { container, onChange, endpoint, targetBucket } =
      setupAndRenderLocationDetails();

    // E + V
    await azureArchiveCommonHelper(container, endpoint, targetBucket);

    selectQueueTypeHelper('location-azure-servicebus-queue-v1', container);

    await serviceBusQueueHelper(container);

    await authClientSecretHelper(container);

    expect(onChange).toHaveBeenCalledWith({
      bucketName: targetBucket,
      endpoint,
      queue: {
        type: 'location-azure-servicebus-queue-v1',
        queueName: 'mock-queue-name',
        endpoint: 'mock-endpoint',
      },
      auth: {
        type: 'location-azure-client-secret',
        tenantId: 'mock-tenant-id',
        clientId: 'mock-azure-client-id',
        clientKey: 'mock-azure-client-key',
      },
    });
  });

  test('Azure Service Bus Queue + Shared Access Signature', async () => {
    // S
    const { container, onChange, endpoint, targetBucket } =
      setupAndRenderLocationDetails();

    // E + V
    await azureArchiveCommonHelper(container, endpoint, targetBucket);
    selectQueueTypeHelper('location-azure-servicebus-queue-v1', container);

    await serviceBusQueueHelper(container);

    selectAuthenticationHelper(
      'location-azure-shared-access-signature',
      container,
    );

    await authSharedAccessSignature(container, true);

    expect(onChange).toHaveBeenCalledWith({
      bucketName: targetBucket,
      endpoint,
      queue: {
        type: 'location-azure-servicebus-queue-v1',
        queueName: 'mock-queue-name',
        endpoint: 'mock-endpoint',
      },
      auth: {
        type: 'location-azure-shared-access-signature',
        storageSasToken: 'mock-sas-token-for-storage',
        serviceBusSasToken: 'mock-sas-token-for-service-bus',
      },
    });
  });

  test('Azure Storage Queue + Client Secret', async () => {
    // S
    const { container, onChange, endpoint, targetBucket } =
      setupAndRenderLocationDetails();

    // E + V
    await azureArchiveCommonHelper(container, endpoint, targetBucket);

    selectQueueTypeHelper('location-azure-storage-queue-v1', container);

    await storageQueueHelper(container);

    await authClientSecretHelper(container);

    expect(onChange).toHaveBeenCalledWith({
      bucketName: targetBucket,
      endpoint,
      queue: {
        type: 'location-azure-storage-queue-v1',
        queueName: 'mock-queue-name',
        endpoint: 'mock-endpoint',
      },
      auth: {
        type: 'location-azure-client-secret',
        tenantId: 'mock-tenant-id',
        clientId: 'mock-azure-client-id',
        clientKey: 'mock-azure-client-key',
      },
    });
  });

  test('Azure Storage Queue + Shared Access Signature', async () => {
    // S
    const { container, onChange, endpoint, targetBucket } =
      setupAndRenderLocationDetails();

    // E + V
    await azureArchiveCommonHelper(container, endpoint, targetBucket);

    selectQueueTypeHelper('location-azure-storage-queue-v1', container);

    await storageQueueHelper(container);

    selectAuthenticationHelper(
      'location-azure-shared-access-signature',
      container,
    );

    await authSharedAccessSignature(container);

    expect(onChange).toHaveBeenCalledWith({
      bucketName: targetBucket,
      endpoint,
      queue: {
        type: 'location-azure-storage-queue-v1',
        queueName: 'mock-queue-name',
        endpoint: 'mock-endpoint',
      },
      auth: {
        type: 'location-azure-shared-access-signature',
        storageSasToken: 'mock-sas-token-for-storage',
      },
    });
  });

  test('Azure Storage Queue + Shared Key', async () => {
    // S
    const { container, onChange, endpoint, targetBucket } =
      setupAndRenderLocationDetails();

    // E + V
    await azureArchiveCommonHelper(container, endpoint, targetBucket);

    selectQueueTypeHelper('location-azure-storage-queue-v1', container);

    await storageQueueHelper(container);

    selectAuthenticationHelper('location-azure-shared-key', container);

    await authSharedKey(container);

    expect(onChange).toHaveBeenCalledWith({
      bucketName: targetBucket,
      endpoint,
      queue: {
        type: 'location-azure-storage-queue-v1',
        queueName: 'mock-queue-name',
        endpoint: 'mock-endpoint',
      },
      auth: {
        type: 'location-azure-shared-key',
        accountName: 'mock-azure-account-name',
        accountKey: 'mock-azure-account-key',
      },
    });
  });
});
