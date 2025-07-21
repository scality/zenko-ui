import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { Form, FormSection } from '@scality/core-ui';
import {
  fireEvent,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  mockBucketListing,
  mockBucketOperations,
} from '../../../js/mock/S3ClientMSWHandlers';
import {
  getConfigOverlay,
  getStorageConsumptionMetricsHandlers,
} from '../../../js/mock/managementClientMSWHandlers';
import { PerLocationMap } from '../../../types/config';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import {
  INSTANCE_ID,
  waitForSelectOptionToBeEnabled,
} from '../../actions/__tests__/utils/testUtil';
import {
  mockOffsetSize,
  reduxRender,
  selectClick,
  TEST_API_BASE_URL,
  zenkoUITestConfig,
} from '../../utils/testUtil';
import ExpirationForm, { GeneralExpirationGroup } from '../ExpirationForm';
import { validateExpirationWithTags } from '../utils';

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
jest.setTimeout(60_000);

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
    isVeeamTagged: (bucketName) => (bucketName === 'bucket1' ? true : false),
  }),
  ...getStorageConsumptionMetricsHandlers(
    zenkoUITestConfig.managementEndpoint,
    INSTANCE_ID,
  ),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 800);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const WithFormProvider = ({ children }) => {
  const formMethods = useForm({
    defaultValues: {
      enabled: true,
      bucketName: '',
      name: 'Test Workflow',
      type: 'expiration',
      workflowId: '',
      filter: {
        objectKeyPrefix: '',
        objectTags: [{ key: '', value: '' }],
      },
      currentVersionTriggerDelayDays: null,
      previousVersionTriggerDelayDays: null,
      expireDeleteMarkersTrigger: false,
      incompleteMultipartUploadTriggerDelayDays: null,
    },
  });
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
  understandISVRiskCheckbox: () =>
    screen.queryByRole('checkbox', { name: /I understand what I'm doing/i }),
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

    await waitForElementToBeRemoved(
      () => [...screen.queryAllByText(/Loading/i)],
      { timeout: 8000 },
    );

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

    await waitForSelectOptionToBeEnabled(() =>
      selectors.versionedBucketOption(),
    );

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

  it('should validate ISV bucket confirmation checkbox', async () => {
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

    await waitForElementToBeRemoved(
      () => [...screen.queryAllByText(/Loading/i)],
      { timeout: 8000 },
    );

    await selectClick(selectors.bucketSelect());

    await waitForSelectOptionToBeEnabled(() =>
      selectors.versionedBucketOption(),
    );

    await userEvent.click(selectors.versionedBucketOption());

    expect(
      await screen.findByText(
        /This bucket is tagged as being used in a connector use-case/i,
      ),
    ).toBeInTheDocument();

    const checkbox = selectors.understandISVRiskCheckbox();
    await userEvent.click(checkbox);

    const expireCurrentToggleState = result.container.querySelector(
      '[for="expireCurrentVersions"]',
    )!.parentElement!.parentElement!.parentElement!;
    const expireCurrent = expireCurrentToggleState.querySelector(
      'input[placeholder="currentVersionDelayDaysToggle"]',
    );
    await userEvent.click(notFalsyTypeGuard(expireCurrent));

    const formValidationAfterCheck = screen.getByTestId('form-expiration');
    await waitFor(() =>
      expect(formValidationAfterCheck.textContent).toBe('form-valid'),
    );
  });

  it('should not show ISV checkbox and allow submission for non-ISV buckets', async () => {
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

    await waitForElementToBeRemoved(
      () => [...screen.queryAllByText(/Loading/i)],
      { timeout: 8000 },
    );

    await selectClick(selectors.bucketSelect());
    await waitForSelectOptionToBeEnabled(() =>
      selectors.suspendedBucketOption(),
    );
    await userEvent.click(selectors.suspendedBucketOption());

    expect(
      screen.queryByText(
        /This bucket is tagged as being used in a connector use-case/,
      ),
    ).not.toBeInTheDocument();

    expect(selectors.understandISVRiskCheckbox()).not.toBeInTheDocument();

    const expireCurrentToggleState = result.container.querySelector(
      '[for="expireCurrentVersions"]',
    )!.parentElement!.parentElement!.parentElement!;
    const expireCurrent = expireCurrentToggleState.querySelector(
      'input[placeholder="currentVersionDelayDaysToggle"]',
    );
    await userEvent.click(notFalsyTypeGuard(expireCurrent));

    const formValidation = screen.getByTestId('form-expiration');
    await waitFor(() => expect(formValidation.textContent).toBe('form-valid'));
  });

  it('should disable the delete markers and incomplete multipart upload when tags are edited', async () => {
    const { component: result } = reduxRender(
      <WithFormProvider>
        <Form layout={{ kind: 'tab' }}>
          <ExpirationForm />
        </Form>
      </WithFormProvider>,
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

    expect(expireIncompleteMultipart).toBeEnabled();

    const tag1Key = screen.getByLabelText(/Tag 1 key/i);
    expect(tag1Key).toBeInTheDocument();

    await userEvent.type(tag1Key, 'test-key');

    expect(removeExpired).toBeDisabled();
    expect(expireIncompleteMultipart).toBeDisabled();
  });

  it('should invalidate form when delete markers or incomplete multipart are enabled with edited tags', async () => {
    const minimalSchema = Joi.object({
      filter: Joi.object({
        objectTags: Joi.array().optional(),
        objectKeyPrefix: Joi.string().optional().allow(''),
      }).optional(),
      expireDeleteMarkersTrigger: Joi.boolean().optional(),
      incompleteMultipartUploadTriggerDelayDays: Joi.number()
        .optional()
        .allow(null),
    })
      .unknown(true)
      .custom(validateExpirationWithTags);

    const WithFormProviderValidation = ({ children }) => {
      const formMethods = useForm({
        mode: 'all',
        resolver: joiResolver(minimalSchema),
        defaultValues: {
          filter: {
            objectTags: [{ key: '', value: '' }],
          },
          expireDeleteMarkersTrigger: false,
          incompleteMultipartUploadTriggerDelayDays: null,
        },
      });
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

    const { component: result } = reduxRender(
      <WithFormProviderValidation>
        <Form layout={{ kind: 'tab' }}>
          <FormSection title={{ name: 'General' }}>
            <GeneralExpirationGroup />
          </FormSection>
          <ExpirationForm />
        </Form>
      </WithFormProviderValidation>,
    );

    let formValidation = screen.getByTestId('form-expiration');
    await waitFor(() => expect(formValidation.textContent).toBe('form-valid'));

    // Enable incomplete multipart upload action
    const expireIncompleteMultipartToggleState = result.container.querySelector(
      '[for="expireIncompleteMultipart"]',
    )!.parentElement!.parentElement!.parentElement!;
    const expireIncompleteMultipart =
      expireIncompleteMultipartToggleState.querySelector(
        'input[placeholder="incompleteMultipartUploadDelayDaysToggle"]',
      );

    await userEvent.click(notFalsyTypeGuard(expireIncompleteMultipart));

    await waitFor(() => expect(formValidation.textContent).toBe('form-valid'));

    const tag1Key = screen.getByLabelText(/Tag 1 key/i);
    await userEvent.type(tag1Key, 'test-key');

    await waitFor(() =>
      expect(formValidation.textContent).toBe('form-invalid'),
    );
  });
});
