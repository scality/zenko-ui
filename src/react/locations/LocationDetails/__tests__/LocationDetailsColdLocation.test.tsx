import { getByRole, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationQueue, type Locationv1Details } from '../../../../js/managementClient/api';
import type { LocationTypeKey } from '../../../../types/config';
import { renderWithCustomRoute } from '../../../utils/testUtil';
import LocationDetailsColdLocation from '../LocationDetailsColdLocation';

const setupAndRender = (details?: Locationv1Details, locationType: LocationTypeKey = 'location-aws-glacier-v1') => {
  const onChange = jest.fn();
  const { container } = renderWithCustomRoute(
    <LocationDetailsColdLocation locationType={locationType} details={details || {}} onChange={onChange} />,
    '/',
  );
  return { onChange, container };
};

type queueType = 'location-polling-v1' | 'location-aws-sqs-v1';
const QUEUE_TYPE_LABELS: Record<queueType, string> = {
  'location-polling-v1': 'Polling',
  'location-aws-sqs-v1': 'AWS SQS',
};
const selectQueueType = async (queue: queueType, container: HTMLElement) => {
  const selector = getByRole(container, 'textbox', { name: /Queue type/i });
  await userEvent.click(selector);
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.click(screen.getByText(QUEUE_TYPE_LABELS[queue]));
};

const fillCredentials = async (
  container: HTMLElement,
  opts: { accessKey: string; secretKey: string; bucketName: string; endpoint?: string; region?: string },
) => {
  await userEvent.click(getByRole(container, 'textbox', { name: /Access Key/i }));
  await userEvent.paste(opts.accessKey);
  const secretInput = container.querySelector<HTMLInputElement>('#secretKey');
  if (!secretInput) throw new Error('Secret Key input not found');
  await userEvent.click(secretInput);
  await userEvent.paste(opts.secretKey);
  await userEvent.click(getByRole(container, 'textbox', { name: /Target Bucket Name/i }));
  await userEvent.paste(opts.bucketName);
  if (opts.endpoint) {
    await userEvent.click(getByRole(container, 'textbox', { name: /Endpoint/i }));
    await userEvent.paste(opts.endpoint);
  }
  if (opts.region) {
    await userEvent.click(getByRole(container, 'textbox', { name: /Region/i }));
    await userEvent.paste(opts.region);
  }
};

describe('<LocationDetailsColdLocation />', () => {
  it('renders empty form with all fields for AWS Glacier', () => {
    setupAndRender(undefined, 'location-aws-glacier-v1');
    expect(screen.getByRole('textbox', { name: /Endpoint/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Access Key/i })).toBeInTheDocument();
    expect(document.getElementById('secretKey')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Target Bucket Name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Region/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Storage class/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Queue type/i })).toBeInTheDocument();
  });

  it('renders empty form with all fields for Scaleway Glacier', () => {
    setupAndRender(undefined, 'location-scaleway-glacier-v1');
    expect(screen.getByRole('textbox', { name: /Endpoint/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Access Key/i })).toBeInTheDocument();
    expect(document.getElementById('secretKey')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Target Bucket Name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Region/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Storage class/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Queue type/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Polling interval/i })).toBeInTheDocument();
  });

  it('renders empty form with OVH-specific labels for OVH Cold Archive', () => {
    const { container } = setupAndRender(undefined, 'location-ovh-cold-archive-v1');
    expect(getByRole(container, 'textbox', { name: /OVH Access Key/i })).toBeInTheDocument();
    expect(container.querySelector<HTMLInputElement>('#secretKey')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Target Bucket Name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Queue type/i })).toBeInTheDocument();
  });

  it('renders empty form with generic labels for Versity Tape Archive', () => {
    const { container } = setupAndRender(undefined, 'location-versity-tape-archive-v1');
    // Versity is on-prem tape; credential labels are generic, no provider defaults.
    expect(getByRole(container, 'textbox', { name: /^Access Key/i })).toBeInTheDocument();
    expect(container.querySelector<HTMLInputElement>('#secretKey')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Target Bucket Name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Queue type/i })).toBeInTheDocument();
  });

  it('calls onChange with credentials and default polling queue', async () => {
    const { container, onChange } = setupAndRender();
    await fillCredentials(container, {
      accessKey: 'AKIAIOSFODNN7EXAMPLE',
      secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
      bucketName: 'my-glacier-bucket',
    });
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.accessKey).toBe('AKIAIOSFODNN7EXAMPLE');
    expect(lastCall.bucketName).toBe('my-glacier-bucket');
    expect(lastCall.queue?.type).toBe(LocationQueue.TypeEnum.PollingV1.toString());
  });

  it('switches to SQS queue and shows queue URL field', async () => {
    const { container, onChange } = setupAndRender();
    await selectQueueType('location-aws-sqs-v1', container);
    expect(screen.getByRole('textbox', { name: /SQS Queue URL/i })).toBeInTheDocument();
    await userEvent.click(getByRole(container, 'textbox', { name: /SQS Queue URL/i }));
    await userEvent.paste('https://sqs.us-east-1.amazonaws.com/123456789012/my-queue');
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.queue?.type).toBe(LocationQueue.TypeEnum.AwsSqsV1.toString());
    expect((lastCall.queue as { queueUrl?: string }).queueUrl).toBe(
      'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    );
  });

  it('prefills from details', () => {
    const details: Locationv1Details = {
      endpoint: 'https://s3.us-east-1.amazonaws.com',
      accessKey: 'prefilled-key',
      secretKey: 'should-not-be-shown',
      bucketName: 'prefilled-bucket',
      region: 'us-east-1',
      storageClass: 'GLACIER',
      queue: {
        type: LocationQueue.TypeEnum.PollingV1,
      },
    };
    const { container, onChange } = setupAndRender(details);
    expect(getByRole(container, 'textbox', { name: /Endpoint/i })).toHaveValue('https://s3.us-east-1.amazonaws.com');
    expect(getByRole(container, 'textbox', { name: /Access Key/i })).toHaveValue('prefilled-key');
    expect(getByRole(container, 'textbox', { name: /Target Bucket Name/i })).toHaveValue('prefilled-bucket');
    expect(getByRole(container, 'textbox', { name: /Region/i })).toHaveValue('us-east-1');
    expect(getByRole(container, 'textbox', { name: /Storage class/i })).toHaveValue('GLACIER');
    // Polling interval input should render when details.queue is a polling queue,
    // even if details.queue does not include `interval` itself (defaults fill in).
    expect(getByRole(container, 'textbox', { name: /Polling interval/i })).toBeInTheDocument();
    // secretKey from the server must NOT be displayed (always reset in edit mode).
    expect(container.querySelector<HTMLInputElement>('#secretKey')?.value).toBe('');
    // Mount-time onChange must fire with the prefilled state so the parent
    // LocationEditor receives initial details even if the user doesn't touch
    // any field before clicking Save.
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: 'https://s3.us-east-1.amazonaws.com',
        accessKey: 'prefilled-key',
        bucketName: 'prefilled-bucket',
        region: 'us-east-1',
        storageClass: 'GLACIER',
        secretKey: '',
      }),
    );
  });
});
