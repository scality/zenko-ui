import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
} from '../../utils/test';
import { screen, waitFor } from '@testing-library/react';
import { List } from 'immutable';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import ReplicationForm, { GeneralReplicationGroup } from '../ReplicationForm';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import userEvent from '@testing-library/user-event';
import { PerLocationMap } from '../../../types/config';
import { S3Bucket } from '../../../types/s3';
import { log } from 'vega';
import { newExpiration, newReplicationForm, newTransition } from '../utils';
import { Form, FormSection } from '@scality/core-ui';

const instanceId = 'instanceId';
const accountId = 'accountId';
const accountName = 'pat';
const replicationId = 'expirationId';

const S3BucketList: List<S3Bucket> = [
  {
    CreationDate: '2020-01-01T00:00:00.000Z',
    Name: 'bucket1',
    LocationConstraint: 'us-east-1',
    VersionStatus: 'Disabled',
  },
  {
    CreationDate: '2021-01-01T00:00:00.000Z',
    Name: 'bucket2',
    LocationConstraint: 'us-east-1',
    VersionStatus: 'Enabled',
  },
];

const bucketName = 'replication-for-chapter-ux';
const locations: PerLocationMap<any> = {
  'chapter-ux': {
    details: {
      accessKey: 'AMFFHQC1TTUIQ9K6B7LO',
      bootstrapList: [],
      bucketName,
      endpoint: 'http://s3.workloadplane.scality.local',
      region: 'us-east-1',
      secretKey:
        'ICzSVrjcUJYYMiGU2TJV4hcCyuO0Ds6OJsh7D/Nyp/ua9zmCp2IxhBf38nv4N4x/9A6oZG11yiPkcFq7sYNWnepIuX+hJLlLN0RI/0MFv7WBhvA0Z5GN5zw24BtTiR6STgCxqaJ0kbE/2mc47TReap9PqiZ/vQZc4kSbBH+75EDTFqZsgKmEVGKNgKb9Llt56Ml4htdR3NJZ/Pd+BwiKMf1A6L9aroylkx8plarOkmM+9FS72lV2nDa/OStezRsNdsTDEMpXfApTewSBEE/Rq+7lgva8xrXZWz/V7f4L953m9i/lSd8ZhmCH2vpqowg+qGgVkVWMiSoAt5UpkzZBTg==',
    },
    locationType: 'location-scality-artesca-s3-v1',
    name: 'chapter-ux',
    objectId: '4ab68d3f-9eec-11ec-ae58-6e38b828d159',
  },
  'chapter-ux2': {
    details: {
      accessKey: 'AMFFHQC1TTUIQ9K6B7LO',
      bootstrapList: [],
      bucketName,
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
    `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/accounts/${accountName}/workflows/${replicationId}`,
    (req, res, ctx) => res(ctx.json([])),
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
  const formMethods = useForm({
    defaultValues: {
      type: 'replication',
      replication: newReplicationForm(bucketName),
      expiration: newExpiration(bucketName),
      transition: newTransition(bucketName),
    },
  });
  const {
    formState: { isValid },
  } = formMethods;
  const childrenWithProps = React.Children.map(children, (child) => {
    return (
      <>
        <div data-testid="form-replication">
          {isValid ? 'form-valid' : 'form-invalid'}
        </div>
        {child}
      </>
    );
  });
  return <FormProvider {...formMethods}>{childrenWithProps}</FormProvider>;
};

// prettier-ignore
describe('ReplicationForm', () => {
  it('should render a form for replication workflow', async () => {
    try {
      const { component } =
        reduxRender(
          <WithFormProvider>
            <Form layout={{ kind: 'tab' }}>
              <FormSection title={{ name: 'General' }}>
                <GeneralReplicationGroup prefix="replication." />
              </FormSection>
              <ReplicationForm
                prefix="replication."
                bucketList={S3BucketList}
                locations={locations}
              />
            </Form>
          </WithFormProvider>,
          {
            networkActivity: {
              counter: 0,
              messages: List.of(),
            },
            instances: {
              selectedId: instanceId,
            },
            auth: {
              config: { features: [] },
              selectedAccount: { id: accountId },
            },
            configuration: {
              latest: {
                locations,
                endpoints: [],
              },
            },
          }
        );

      await waitFor(() => screen.getByText(/General/i));
      expect(screen.getByText(/State/i)).toBeInTheDocument();
      expect(screen.getByText(/Source/i)).toBeInTheDocument();
      expect(screen.getByText(/Bucket Name/i)).toBeInTheDocument();
      expect(screen.getByText(/Filter/i)).toBeInTheDocument();
      expect(screen.getByText(/Prefix/i)).toBeInTheDocument();
      expect(screen.getByText(/Destination/i)).toBeInTheDocument();
      expect(screen.getByText(/Location Name/i)).toBeInTheDocument();

      const formValidationa = screen.getByTestId('form-replication');
      expect(formValidationa.textContent).toBe('form-valid');

      // Select the Source Bucket.
      const sourceBucket = screen.getByTestId('select-bucket-name-replication');
      const sControl = sourceBucket.querySelector('.sc-select__control');
      const srcCtl = notFalsyTypeGuard(sControl);
      userEvent.click(srcCtl);

      const sOpt = sourceBucket.querySelector('.sc-select__option')
      expect(sOpt?.textContent).toBe("bucket1 (us-east-1 / Local Filesystem)");
      expect(sOpt?.getAttribute('aria-disabled')).toBe('true');
      userEvent.click((srcCtl));
      expect(srcCtl?.textContent).toBe("Select...");
      userEvent.click((srcCtl));

      const sOpts = sourceBucket.querySelectorAll('.sc-select__option')[1]
      const sOpt2 = notFalsyTypeGuard(sOpts);
      expect(sOpt2.textContent).toBe("bucket2 (us-east-1 / Local Filesystem)");
      userEvent.click(sOpt2);
      expect(srcCtl?.textContent).toBe("bucket2 (us-east-1 / Local Filesystem)");

      // Select the first destination.
      const LocationName = screen.getByTestId('select-location-name-replication-0');
      const lControl = LocationName.querySelector('.sc-select__control')
      const locCtl = notFalsyTypeGuard(lControl);
      userEvent.click(locCtl);
      expect(locCtl.querySelector('.sc-select__single-value')?.textContent).toBe(undefined);
      const lOption = LocationName.querySelector('.sc-select__option');
      const lOpt = notFalsyTypeGuard(lOption)
      expect(lOpt?.textContent).toBe("chapter-ux (ARTESCA)");
      userEvent.click(lOpt);
      expect(locCtl.querySelector('.sc-select__single-value')?.textContent).toBe('chapter-ux (ARTESCA)');
      const lAddButton = LocationName.querySelector('#addbtn0')
      userEvent.click(notFalsyTypeGuard(lAddButton))
      expect(lAddButton).toBeDisabled()

      // Select the second destination.
      const NewLocationName = screen.getByTestId('select-location-name-replication-1')
      const nlControl = NewLocationName.querySelector('.sc-select__control')
      const nlCtl = notFalsyTypeGuard(nlControl)
      userEvent.click(nlCtl);
      expect(nlCtl.querySelector('.sc-select__single-value')?.textContent).toBe(undefined);
      const nlOption = NewLocationName.querySelectorAll('.sc-select__option')[1]
      const nlOpt = notFalsyTypeGuard(nlOption)
      expect(nlOpt?.textContent).toBe("chapter-ux2 (ARTESCA)");
      userEvent.click(nlOpt);
      expect(nlCtl.querySelector('.sc-select__single-value')?.textContent).toBe('chapter-ux2 (ARTESCA)');
      const nlAddButon = NewLocationName.querySelector('#addbtn1')
      expect(nlAddButon).toBeDisabled()

      const formValidation = screen.getByTestId('form-replication');
      expect(formValidation.textContent).toBe('form-valid');
    } catch (e) {
      console.log('should render a form for replication workflow: ', e);
      throw e;
    }
  });
});
