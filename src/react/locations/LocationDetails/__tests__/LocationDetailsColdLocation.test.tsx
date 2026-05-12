import { fireEvent, getByRole, screen } from '@testing-library/react';
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
const selectQueueType = (queue: queueType, container: HTMLElement) => {
  const selector = getByRole(container, 'textbox', { name: /Queue type/i });
  fireEvent.keyDown(selector, { key: 'ArrowDown', which: 40, keyCode: 40 });
  if (queue === 'location-aws-sqs-v1') {
    fireEvent.keyDown(selector, { key: 'ArrowDown', which: 40, keyCode: 40 });
  }
  fireEvent.keyDown(selector, { key: 'Enter', which: 13, keyCode: 13 });
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
    expect(lastCall.queue?.type).toBe('location-polling-v1');
  });

  it('switches to SQS queue and shows queue URL field', async () => {
    const { container, onChange } = setupAndRender();
    selectQueueType('location-aws-sqs-v1', container);
    expect(screen.getByRole('textbox', { name: /SQS Queue URL/i })).toBeInTheDocument();
    await userEvent.click(getByRole(container, 'textbox', { name: /SQS Queue URL/i }));
    await userEvent.paste('https://sqs.us-east-1.amazonaws.com/123456789012/my-queue');
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall.queue?.type).toBe('location-aws-sqs-v1');
    expect((lastCall.queue as { queueUrl?: string }).queueUrl).toBe(
      'https://sqs.us-east-1.amazonaws.com/123456789012/my-queue',
    );
  });

  it('prefills from details', () => {
    const details: Locationv1Details = {
      endpoint: 'https://s3.us-east-1.amazonaws.com',
      accessKey: 'prefilled-key',
      secretKey: '',
      bucketName: 'prefilled-bucket',
      region: 'us-east-1',
      storageClass: 'GLACIER',
      queue: {
        type: LocationQueue.TypeEnum.PollingV1,
      },
    };
    const { container } = setupAndRender(details);
    expect(getByRole(container, 'textbox', { name: /Endpoint/i })).toHaveValue('https://s3.us-east-1.amazonaws.com');
    expect(getByRole(container, 'textbox', { name: /Access Key/i })).toHaveValue('prefilled-key');
    expect(getByRole(container, 'textbox', { name: /Target Bucket Name/i })).toHaveValue('prefilled-bucket');
    expect(getByRole(container, 'textbox', { name: /Region/i })).toHaveValue('us-east-1');
    expect(getByRole(container, 'textbox', { name: /Storage class/i })).toHaveValue('GLACIER');
  });
});
