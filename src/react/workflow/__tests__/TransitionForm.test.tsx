import { getByRole, getByText, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import {
  mockOffsetSize,
  reduxRender,
  Wrapper as wrapper,
} from '../../utils/test';
import { List } from 'immutable';
import { S3Bucket } from '../../../types/s3';
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

const versionedBucket = 'bucket1';
const notVersionedBucket = 'bucket2';

const S3BucketList: List<S3Bucket> = List.of(
  {
    CreationDate: '2020-01-01T00:00:00.000Z',
    Name: versionedBucket,
    LocationConstraint: 'us-east-1',
    VersionStatus: 'Enabled',
  },
  {
    CreationDate: '2021-01-01T00:00:00.000Z',
    Name: notVersionedBucket,
    LocationConstraint: 'us-east-1',
    VersionStatus: 'Suspended',
  },
);

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

beforeAll(() => {
  mockOffsetSize(200, 800);
});

describe('TransitionForm', () => {
  beforeEach(() => {
    reduxRender(
      <WithFormProvider>
        <Form layout={{ kind: 'tab' }}>
          <FormSection title={{ name: 'General' }}>
            <GeneralTransitionGroup />
          </FormSection>
          <TransitionForm bucketList={S3BucketList} locations={locations} />
        </Form>
      </WithFormProvider>,
      {
        wrapper,
      },
    );
  });

  it('should render all the expected fields', () => {
    const hidden = { hidden: true };
    //V
    //State to be in the document
    const general = screen.getByText(/General/i);
    const stateContainer = general.parentElement!.parentElement!;
    const stateToggle = getByRole(stateContainer, 'checkbox', hidden);
    expect(stateToggle).toBeInTheDocument();

    //Source bucket name to be in the document
    const source = screen.getAllByText(/Source/i)[0]!;
    const sourceBucketContainer = source.parentElement!.parentElement!;
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

  it('should disable previous version when the source bucket is not versioned', () => {
    //E
    //change source butcket to not versioned one
    const sourceBucketContainer =
      screen.getByText(/Bucket Name/i).parentElement!.parentElement!
        .parentElement!.parentElement!;
    userEvent.click(
      notFalsyTypeGuard(getByText(sourceBucketContainer, /select/i)),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(`${notVersionedBucket} \\(us-east-1 / \\)`, 'i'),
      }),
    );
    //V
    //Ensure previous versions radio btn is disabled
    expect(
      screen.getByRole('radio', { name: /previous version/i }),
    ).toBeDisabled();
  });

  it('should enable previous version when the source bucket is versioned', () => {
    //E
    //change source butcket to versioned one
    const sourceBucketContainer =
      screen.getByText(/Bucket Name/i).parentElement!.parentElement!
        .parentElement!.parentElement!;
    userEvent.click(
      notFalsyTypeGuard(getByText(sourceBucketContainer, /select/i)),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(`${versionedBucket} \\(us-east-1 / \\)`, 'i'),
      }),
    );
    //V
    //Ensure previous versions radio btn is enabled
    expect(
      screen.getByRole('radio', { name: /previous version/i }),
    ).not.toBeDisabled();
  });

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
    userEvent.click(
      notFalsyTypeGuard(getByText(sourceBucketContainer, /select/i)),
    );
    userEvent.click(
      screen.getByRole('option', {
        name: new RegExp(`${notVersionedBucket} \\(us-east-1 / \\)`, 'i'),
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
        name: new RegExp(`${versionedBucket} \\(us-east-1 / \\)`, 'i'),
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
