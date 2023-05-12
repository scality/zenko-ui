import { setupServer } from 'msw/node';
import {
  getAllByRole,
  getByRole,
  getByText,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  mockOffsetSize,
  reduxRender,
  Wrapper as wrapper,
  zenkoUITestConfig,
} from '../../utils/testUtil';
import {
  GeneralTransitionGroup,
  TransitionForm,
  transitionSchema,
} from '../TransitionForm';
import { Locations } from '../../../types/config';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from '@hapi/joi';
import { newTransition } from '../utils';
import userEvent from '@testing-library/user-event';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
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

const versionedBucket = 'bucket1';
const notVersionedBucket = 'bucket2';

const locationName = 'chapter-ux';
const locationType = 'ARTESCA';
const triggerDelayDays = '2';

const locations: Locations = {
  [locationName]: {
    details: {
      accessKey: 'AMFFHQC1TTUIQ9K6B7LO',
      bootstrapList: [],
      bucketName: 'bucket',
      endpoint: 'http://s3.workloadplane.scality.local',
      region: 'us-east-1',
      secretKey:
        'ICzSVrjcUJYYMiGU2TJV4hcCyuO0Ds6OJsh7D/Nyp/ua9zmCp2IxhBf38nv4N4x/9A6oZG11yiPkcFq7sYNWnepIuX+hJLlLN0RI/0MFv7WBhvA0Z5GN5zw24BtTiR6STgCxqaJ0kbE/2mc47TReap9PqiZ/vQZc4kSbBH+75EDTFqZsgKmEVGKNgKb9Llt56Ml4htdR3NJZ/Pd+BwiKMf1A6L9aroylkx8plarOkmM+9FS72lV2nDa/OStezRsNdsTDEMpXfApTewSBEE/Rq+7lgva8xrXZWz/V7f4L953m9i/lSd8ZhmCH2vpqowg+qGgVkVWMiSoAt5UpkzZBTg==',
    },
    locationType: 'location-scality-artesca-s3-v1',
    name: locationName,
    objectId: '4ab68d3f-9eec-11ec-ae58-6e38b828d159',
  },
};

const WithFormProvider = ({ children }: { children: ReactNode }) => {
  const formMethods = useForm({
    mode: 'all',
    resolver: joiResolver(Joi.object(transitionSchema)),
    defaultValues: newTransition(),
  });
  const {
    formState: { isValid },
  } = formMethods;

  return (
    <FormProvider {...formMethods}>
      <>
        {isValid ? 'Form is valid' : 'Form is invalid'}
        {children}
      </>
    </FormProvider>
  );
};

const server = setupServer(
  mockBucketListing(),
  getConfigOverlay(zenkoUITestConfig.managementEndpoint, INSTANCE_ID),
  mockBucketOperations({
    isVersioningEnabled: (bucketName) =>
      bucketName === versionedBucket ? true : false,
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

describe('TransitionForm', () => {
  beforeEach(() => {
    reduxRender(
      <WithFormProvider>
        <Form layout={{ kind: 'tab' }}>
          <FormSection title={{ name: 'General' }}>
            <GeneralTransitionGroup />
          </FormSection>
          <TransitionForm locations={locations} />
        </Form>
      </WithFormProvider>,
    );
  });

  it('should render all the expected fields', async () => {
    const hidden = { hidden: true };
    await waitForElementToBeRemoved(() =>
      screen.getByText(/Loading buckets.../i),
    );
    //V
    //State to be in the document
    const general = screen.getByText(/General/i);
    const stateContainer = general.parentElement!.parentElement!.parentElement!;
    const stateToggle = getAllByRole(stateContainer, 'checkbox', hidden)[0];
    expect(stateToggle).toBeInTheDocument();

    //Source bucket name to be in the document
    const source = screen.getAllByText(/Source/i)[0]!;
    const sourceBucketContainer =
      source.parentElement!.parentElement!.parentElement!;
    const sourceInput = getByRole(sourceBucketContainer, 'textbox', hidden);
    expect(sourceInput).toBeInTheDocument();

    //Filter by prefix to be in the document
    const prefixInput = screen.getByRole('textbox', { name: /prefix/i });
    expect(prefixInput).toBeInTheDocument();

    //filter by tags to be in the document
    const tagInput = screen.getByRole('textbox', { name: /tag 1 key/i });
    expect(tagInput).toBeInTheDocument();

    //Transition current/previous radio btns to be in the document
    const currentRadio = screen.getByRole('radio', {
      name: /current version/i,
    });
    const previousRadio = screen.getByRole('radio', {
      name: /previous version/i,
    });
    expect(currentRadio).toBeInTheDocument();
    expect(previousRadio).toBeInTheDocument();

    //Location to be in the document
    const storageLoc = screen.getByText(/Storage location/i);
    const storageLocContainer =
      storageLoc.parentElement!.parentElement!.parentElement!.parentElement!;
    const storageLocationSelect = getByRole(
      storageLocContainer,
      'textbox',
      hidden,
    );
    expect(storageLocationSelect).toBeInTheDocument();
    //triggerDelayDays to be in the document
    expect(
      screen.getByRole('spinbutton', { name: /Days after object creation/i }),
    ).toBeInTheDocument();
  });

  it('should disable previous version when the source bucket is not versioned', async () => {
    //E
    //change source butcket to not versioned one
    await waitForElementToBeRemoved(() =>
      screen.getByText(/Loading buckets.../i),
    );
    const sourceBucketContainer =
      screen.getByText(/bucket name \*/i).parentElement!.parentElement!
        .parentElement!.parentElement!;
    userEvent.click(
      notFalsyTypeGuard(getByText(sourceBucketContainer, /select/i)),
    );
    await waitFor(() =>
      screen.getByRole('option', {
        name: new RegExp(
          `${notVersionedBucket} \\(us-east-1 / Local Filesystem \\)`,
          'i',
        ),
      }),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(
          `${notVersionedBucket} \\(us-east-1 / Local Filesystem \\)`,
          'i',
        ),
      }),
    );
    //V
    //Ensure previous versions radio btn is disabled
    expect(
      screen.getByRole('radio', { name: /previous version/i }),
    ).toBeDisabled();
  });

  it('should enable previous version when the source bucket is versioned', async () => {
    //E
    //change source butcket to versioned one
    const sourceBucketContainer =
      screen.getByText(/Bucket Name/i).parentElement!.parentElement!
        .parentElement!.parentElement!;
    await waitFor(() => getByText(sourceBucketContainer, /select/i));
    userEvent.click(
      notFalsyTypeGuard(getByText(sourceBucketContainer, /select/i)),
    );
    await waitFor(() =>
      screen.getByRole('option', {
        name: new RegExp(
          `${versionedBucket} \\(us-east-1 / Local Filesystem \\)`,
          'i',
        ),
      }),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(
          `${versionedBucket} \\(us-east-1 / Local Filesystem \\)`,
          'i',
        ),
      }),
    );
    //V
    //Ensure previous versions radio btn is enabled
    expect(
      screen.getByRole('radio', { name: /previous version/i }),
    ).not.toBeDisabled();
  });

  //Skipped because we don't display the helper text anymore as the transition table as been removed
  it.skip('should display an helper text when number of days is singular and target location are selected', () => {
    //E
    //Set target location and triggerDelayDays to 1
    const storageLocationContainer =
      screen.getByText(/Storage location/i).parentElement!.parentElement!
        .parentElement!.parentElement!;
    userEvent.click(
      notFalsyTypeGuard(getByText(storageLocationContainer, /select/i)),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(`${locationName} \\(${locationType}\\)`, 'i'),
      }),
    );
    userEvent.type(
      screen.getByRole('spinbutton', { name: /Days after object creation/i }),
      '1',
    );
    //V
    //Check the sentence
    expect(
      screen.getByText(
        new RegExp(
          `Objects older than 1 day will transition to ${locationName} \\(${locationType}\\)`,
          'i',
        ),
      ),
    );
  });

  //Skipped because we don't display the helper text anymore as the transition table as been removed
  it.skip('should display an helper text when number of days is plural and target location are selected', () => {
    //E
    //Set target location and triggerDelayDays to more than 1
    const storageLocationContainer =
      screen.getByText(/Storage location/i).parentElement!.parentElement!
        .parentElement!.parentElement!;
    userEvent.click(
      notFalsyTypeGuard(getByText(storageLocationContainer, /select/i)),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(`${locationName} \\(${locationType}\\)`, 'i'),
      }),
    );
    userEvent.type(
      screen.getByRole('spinbutton', { name: /Days after object creation/i }),
      '2',
    );
    //V
    //Check the sentence
    expect(
      screen.getByText(
        new RegExp(
          `Objects older than 2 days will transition to ${locationName} \\(${locationType}\\)`,
          'i',
        ),
      ),
    );
  });

  it('should be invalid when all required fileds are not filled', () => {
    //V
    //Check that by default it is not valid
    expect(screen.getByText(/Form is invalid/i)).toBeInTheDocument();
  });

  it('should be valid when all required fileds are filled', async () => {
    //E
    //Fill in all required fields
    const sourceBucketContainer =
      screen.getByText(/Bucket Name/i).parentElement!.parentElement!
        .parentElement!.parentElement!;
    await waitFor(() => getByText(sourceBucketContainer, /select/i));
    userEvent.click(
      notFalsyTypeGuard(getByText(sourceBucketContainer, /select/i)),
    );
    await waitFor(() =>
      screen.getByRole('option', {
        name: new RegExp(
          `${notVersionedBucket} \\(us-east-1 / Local Filesystem \\)`,
          'i',
        ),
      }),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(
          `${notVersionedBucket} \\(us-east-1 / Local Filesystem \\)`,
          'i',
        ),
      }),
    );
    const storageLocationContainer =
      screen.getByText(/Storage location/i).parentElement!.parentElement!
        .parentElement!.parentElement!;
    userEvent.click(
      notFalsyTypeGuard(getByText(storageLocationContainer, /select/i)),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(`${locationName} \\(${locationType}\\)`, 'i'),
      }),
    );
    userEvent.type(
      screen.getByRole('spinbutton', { name: /Days after object creation/i }),
      '2',
    );
    //V
    //Check that the form is now valid
    await waitFor(() =>
      expect(screen.getByText(/Form is valid/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Form is valid/i)).toBeInTheDocument();
  });

  it('should be valid when all required fileds are filled and using 0 as the trigger days', async () => {
    //E
    //Fill in all required fields
    const sourceBucketContainer =
      screen.getByText(/Bucket Name/i).parentElement!.parentElement!
        .parentElement!.parentElement!;

    await waitFor(() => getByText(sourceBucketContainer, /select/i));
    userEvent.click(
      notFalsyTypeGuard(getByText(sourceBucketContainer, /select/i)),
    );
    await waitFor(() =>
      screen.getByRole('option', {
        name: new RegExp(
          `${notVersionedBucket} \\(us-east-1 / Local Filesystem \\)`,
          'i',
        ),
      }),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(
          `${notVersionedBucket} \\(us-east-1 / Local Filesystem \\)`,
          'i',
        ),
      }),
    );
    const storageLocationContainer =
      screen.getByText(/Storage location/i).parentElement!.parentElement!
        .parentElement!.parentElement!;
    userEvent.click(
      notFalsyTypeGuard(getByText(storageLocationContainer, /select/i)),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(`${locationName} \\(${locationType}\\)`, 'i'),
      }),
    );
    userEvent.type(
      screen.getByRole('spinbutton', { name: /Days after object creation/i }),
      '0',
    );
    //V
    //Check that the form is now valid
    await waitFor(() =>
      expect(screen.getByText(/Form is valid/i)).toBeInTheDocument(),
    );
    expect(screen.getByText(/Form is valid/i)).toBeInTheDocument();
  });

  //Skipped because we don't display the transition table anymore
  it.skip('should display the transition table', async () => {
    //E
    const sourceBucketContainer =
      screen.getByText(/Bucket Name/i).parentElement!.parentElement!
        .parentElement!.parentElement!;
    userEvent.click(
      notFalsyTypeGuard(getByText(sourceBucketContainer, /select/i)),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(
          `${versionedBucket} \\(us-east-1 / Local Filesystem \\)`,
          'i',
        ),
      }),
    );
    const storageLocationContainer =
      screen.getByText(/Storage location/i).parentElement!.parentElement!
        .parentElement!.parentElement!;
    userEvent.click(
      notFalsyTypeGuard(getByText(storageLocationContainer, /select/i)),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(`${locationName} \\(${locationType}\\)`, 'i'),
      }),
    );
    userEvent.type(
      screen.getByRole('spinbutton', { name: /Days after object creation/i }),
      triggerDelayDays,
    );

    await waitFor(() =>
      expect(screen.getByText(/description/i)).toBeInTheDocument(),
    );

    //V
    //Check if the transition table render
    expect(
      screen.getByRole('row', {
        name: /2 chapter-ux objects older than 2 days will transition to chapter-ux/i,
      }),
    ).toBeInTheDocument();
  });
});
