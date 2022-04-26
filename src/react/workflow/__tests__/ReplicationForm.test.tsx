import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
} from '../../utils/test';
import {
  screen,
  waitFor,
} from '@testing-library/react';
import { List } from 'immutable';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import ReplicationForm from '../ReplicationForm';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import userEvent from '@testing-library/user-event';
import { PerLocationMap } from '../../../types/config';
import { S3Bucket } from '../../../types/s3';

const instanceId = 'instanceId';
const accountId = 'accountId';
const accountName = 'pat';
const replicationId = 'expirationId';

const S3BucketList: List<S3Bucket>  = [
  {
  CreationDate: '2020-01-01T00:00:00.000Z',
  Name: 'bucket1',
  LocationConstraint: 'us-east-1',
  VersionStatus: 'Disabled'
 },
  {
    CreationDate: '2021-01-01T00:00:00.000Z',
    Name: 'bucket2',
    LocationConstraint: 'us-east-1',
    VersionStatus: 'Enabled'
  }
]

const locations: PerLocationMap<any> = {
  "chapter-ux": {
    "details": {
      "accessKey": "AMFFHQC1TTUIQ9K6B7LO",
      "bootstrapList": [],
      "bucketName": "replication-for-chapter-ux",
      "endpoint": "http://s3.workloadplane.scality.local",
      "region": "us-east-1",
      "secretKey": "ICzSVrjcUJYYMiGU2TJV4hcCyuO0Ds6OJsh7D/Nyp/ua9zmCp2IxhBf38nv4N4x/9A6oZG11yiPkcFq7sYNWnepIuX+hJLlLN0RI/0MFv7WBhvA0Z5GN5zw24BtTiR6STgCxqaJ0kbE/2mc47TReap9PqiZ/vQZc4kSbBH+75EDTFqZsgKmEVGKNgKb9Llt56Ml4htdR3NJZ/Pd+BwiKMf1A6L9aroylkx8plarOkmM+9FS72lV2nDa/OStezRsNdsTDEMpXfApTewSBEE/Rq+7lgva8xrXZWz/V7f4L953m9i/lSd8ZhmCH2vpqowg+qGgVkVWMiSoAt5UpkzZBTg=="
    },
    "locationType": "location-scality-artesca-s3-v1",
    "name": "chapter-ux",
    "objectId": "4ab68d3f-9eec-11ec-ae58-6e38b828d159"
  },
  "us-east-1": {
    "isBuiltin": true,
    "locationType": "location-file-v1",
    "name": "us-east-1",
    "objectId": "95dbedf5-9888-11ec-8565-1ac2af7d1e53"
  }
}

const server = setupServer(rest.post(
  `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/accounts/${accountName}/workflows/${replicationId}`,
  (req, res, ctx) => res(ctx.json([])),
),);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 800);
  jest.setTimeout(10_000);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const WithFormProvider = ({children}) => {
  const formMethods = useForm();
  const { formState: { isValid  } } = formMethods;
  const childrenWithProps = React.Children.map(children, child => {
    return(
      <>
         <div data-testid="form-replication">{isValid ? 'form-valid' : 'form-invalid'}</div>
         {child}
       </>
    );
  });
  return <FormProvider {...formMethods}>{childrenWithProps}</FormProvider>

}

describe('ReplicationForm', () => {
  it('should render a form for replication workflow', async () => {
    try {

      const { component}   = reduxRender(<WithFormProvider><ReplicationForm bucketList={S3BucketList} locations={locations}/></WithFormProvider>, {
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
      });
      
      await waitFor(() => screen.getByText(/General/i));
      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('Source')).toBeInTheDocument();
      expect(screen.getByText('Bucket Name')).toBeInTheDocument();
      expect(screen.getByText('Filter (optional)')).toBeInTheDocument();
      expect(screen.getByText('Prefix')).toBeInTheDocument();
      expect(screen.getByText('Destination')).toBeInTheDocument();
      expect(screen.getByText('Location Name')).toBeInTheDocument();

      const formValidationa = screen.getByTestId('form-replication');
      expect(formValidationa.textContent).toBe('form-valid');

      const sourceBucket = screen.getByTestId('select-bucket-name-replication');
      userEvent.click(notFalsyTypeGuard(sourceBucket.querySelector('.sc-select__control')));
      expect(sourceBucket.querySelector('.sc-select__option')?.textContent).toBe( "bucket1 (us-east-1 / Local Filesystem)");
      expect(sourceBucket.querySelector('.sc-select__option')?.getAttribute('aria-disabled')).toBe('true');
      userEvent.click(notFalsyTypeGuard(sourceBucket.querySelector('.sc-select__control')));
      expect(notFalsyTypeGuard(sourceBucket.querySelector('.sc-select__control'))?.textContent).toBe("Select...");
      userEvent.click(notFalsyTypeGuard(sourceBucket.querySelector('.sc-select__control')));
      expect(sourceBucket.querySelectorAll('.sc-select__option')[1].textContent).toBe( "bucket2 (us-east-1 / Local Filesystem)");
      userEvent.click(notFalsyTypeGuard(sourceBucket.querySelectorAll('.sc-select__option')[1]));
      expect(notFalsyTypeGuard(sourceBucket.querySelector('.sc-select__control'))?.textContent).toBe("bucket2 (us-east-1 / Local Filesystem)");

      const LocationName = screen.getByTestId('select-location-name-replication');
      userEvent.click(notFalsyTypeGuard(LocationName.querySelector('.sc-select__control')));
      expect(notFalsyTypeGuard(LocationName.querySelector('.sc-select__control')).querySelector('.sc-select__single-value')?.textContent).toBe(undefined);
      expect(LocationName.querySelector('.sc-select__option')?.textContent).toBe( "chapter-ux (ARTESCA)");
      userEvent.click(notFalsyTypeGuard(LocationName.querySelector('.sc-select__option')));
      expect(notFalsyTypeGuard(LocationName.querySelector('.sc-select__control')).querySelector('.sc-select__single-value')?.textContent).toBe('chapter-ux (ARTESCA)');

      const formValidation = screen.getByTestId('form-replication');
      expect(formValidation.textContent).toBe('form-valid');

    } catch (e) {
      console.log('should render a form for replication workflow: ', e);
      throw e;
    }
  });
});