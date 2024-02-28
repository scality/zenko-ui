import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockOffsetSize,
  reduxRender,
  selectClick,
  TEST_API_BASE_URL,
  zenkoUITestConfig,
} from '../../utils/testUtil';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ExpirationForm from '../ExpirationForm';
import { FormProvider, useForm } from 'react-hook-form';
import userEvent from '@testing-library/user-event';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import { PerLocationMap } from '../../../types/config';
import { GeneralExpirationGroup } from '../ExpirationForm';
import { Form, FormSection } from '@scality/core-ui';
import {
  mockBucketListing,
  mockBucketOperations,
} from '../../../js/mock/S3ClientMSWHandlers';
import {
  getConfigOverlay,
  getStorageConsumptionMetricsHandlers,
} from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';

const instanceId = 'instanceId';
const accountName = 'pat';
const expirationId = 'expirationId';
const VERSIONED_BUCKET_NAME = 'bucket1';
const SUSPENDED_BUCKET_NAME = 'bucket2';

const locations: PerLocationMap<any> = {
  'chapter-ux': {
    details: {
      accessKey: 'AMFFHQC1TTUIQ9K6B7LO',
      bootstrapList: [],
      bucketName: 'replication-for-chapter-ux',
      endpoint: 'http://s3.workloadplane.scality.local',
      region: 'us-east-1',
      secretKey:
        'ICzSVrjcUJYYMiGU2TJV4hcCyuO0Ds6OJsh7D/Nyp/ua9zmCp2IxhBf38nv4N4x/9A6oZG11yiPkcFq7sYNWnepIuX+hJLlLN0RI/0MFv7WBhvA0Z5GN5zw24BtTiR6STgCxqaJ0kbE/2mc47TReap9PqiZ/vQZc4kSbBH+75EDTFqZsgKmEVGKNgKb9Llt56Ml4htdR3NJZ/Pd+BwiKMf1A6L9aroylkx8plarOkmM+9FS72lV2nDa/OStezRsNdsTDEMpXfApTewSBEE/Rq+7lgva8xrXZWz/V7f4L953m9i/lSd8ZhmCH2vpqowg+qGgVkVWMiSoAt5UpkzZBTg==',
    },
    locationType: 'location-scality-artesca-s3-v1',
    name: 'chapter-ux',
    objectId: '4ab68d3f-9eec-11ec-ae58-6e38b828d159',
  },
  'us-east-1': {
    isBuiltin: true,
    locationType: 'location-file-v1',
    name: 'us-east-1',
    objectId: '95dbedf5-9888-11ec-8565-1ac2af7d1e53',
  },
};

const server = setupServer(
  rest.post(
    `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/accounts/${accountName}/workflows/${expirationId}`,
    (req, res, ctx) => res(ctx.json([])),
  ),
  mockBucketListing(),
  getConfigOverlay(zenkoUITestConfig.managementEndpoint, INSTANCE_ID),
  mockBucketOperations({
    isVersioningEnabled: (bucketName) =>
      bucketName === VERSIONED_BUCKET_NAME ? true : false,
  }),
  ...getStorageConsumptionMetricsHandlers(
    zenkoUITestConfig.managementEndpoint,
    INSTANCE_ID,
  ),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 800);
  jest.setTimeout(10_000);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const WithFormProvider = ({ children }) => {
  const formMethods = useForm();
  const {
    formState: { isValid },
  } = formMethods;
  const childrenWithProps = React.Children.map(children, (child) => {
    return (
      <>
        <div data-testid="form-expiration">
          {isValid ? 'form-valid' : 'form-invalid'}
        </div>
        {child}
      </>
    );
  });
  return <FormProvider {...formMethods}>{childrenWithProps}</FormProvider>;
};
const selectors = {
  bucketSelect: () => screen.getByLabelText(/bucket name \*/i),
  versionedBucketOption: () =>
    screen.getByRole('option', { name: new RegExp(VERSIONED_BUCKET_NAME) }),
  suspendedBucketOption: () =>
    screen.getByRole('option', { name: new RegExp(SUSPENDED_BUCKET_NAME) }),
};
describe('ExpirationForm', () => {
  it('should render a form for expiration workflow', async () => {
    const { component: result } = reduxRender(
      <WithFormProvider>
        <Form layout={{ kind: 'tab' }}>
          <FormSection title={{ name: 'General' }}>
            <GeneralExpirationGroup />
          </FormSection>
          <ExpirationForm
            //@ts-expect-error fix this when you are working on it
            locations={locations}
          />
        </Form>
      </WithFormProvider>,
    );

    await waitFor(() => screen.getByText(/General/i));
    expect(screen.getByText(/State/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Source/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Bucket Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Filters/i)).toBeInTheDocument();
    expect(screen.getByText(/Prefix/i)).toBeInTheDocument();
    expect(screen.getByText(/Tags/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Action/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/Current/i)).toBeInTheDocument();
    expect(screen.getByText(/Previous/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Remove expired Delete markers/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Expire incomplete Multipart uploads/i),
    ).toBeInTheDocument();

    const spinButton = screen.getAllByRole('spinbutton');
    expect(spinButton[0].getAttribute('type')).toBe('number');
    expect(spinButton[1].getAttribute('type')).toBe('number');
    expect(spinButton[2].getAttribute('type')).toBe('number');

    // Select the Source Bucket.
    await selectClick(selectors.bucketSelect());

    await userEvent.click(selectors.versionedBucketOption());
    const expireCurrentToggleState = result.container.querySelector(
      '[for="expireCurrentVersions"]',
    )!.parentElement!.parentElement!.parentElement!;
    const expireCurrent = expireCurrentToggleState.querySelector(
      'input[placeholder="currentVersionDelayDaysToggle"]',
    );
    await userEvent.click(notFalsyTypeGuard(expireCurrent));

    const expirePreviousToggleState = result.container.querySelector(
      '[for="expirePreviousVersions"]',
    )!.parentElement!.parentElement!.parentElement!;
    const expirePrevious = expirePreviousToggleState.querySelector(
      'input[placeholder="previousVersionDelayDaysToggle"]',
    );

    const removeExpiredToggleState = result.container.querySelector(
      '[for="deleteMarkers"]',
    )!.parentElement!.parentElement!.parentElement!;
    const removeExpired = removeExpiredToggleState.querySelector(
      'input[placeholder="expireDeleteMarkersTrigger"]',
    );

    const expireIncompleteMultipartToggleState = result.container.querySelector(
      '[for="expireIncompleteMultipart"]',
    )!.parentElement!.parentElement!.parentElement!;
    const expireIncompleteMultipart =
      expireIncompleteMultipartToggleState.querySelector(
        'input[placeholder="incompleteMultipartUploadDelayDaysToggle"]',
      );
    await waitFor(() => expect(expirePrevious).not.toBeDisabled());
    expect(expirePrevious).not.toBeDisabled();
    expect(removeExpired).toBeDisabled();
    expect(expireIncompleteMultipart).not.toBeDisabled();

    // Select the Source Bucket.
    fireEvent.keyDown(selectors.bucketSelect(), {
      key: 'ArrowDown',
      which: 40,
      keyCode: 40,
    });
    await userEvent.click(selectors.suspendedBucketOption());

    expect(expireCurrent).not.toBeDisabled();
    expect(expirePrevious).toBeDisabled();
    expect(removeExpired).toBeDisabled();
    expect(expireIncompleteMultipart).not.toBeDisabled();

    const formValidation = screen.getByTestId('form-expiration');
    expect(formValidation.textContent).toBe('form-valid');
  });
});
