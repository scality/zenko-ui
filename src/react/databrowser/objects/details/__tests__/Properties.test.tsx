import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';

import {
  INSTANCE_ID,
  OBJECT_METADATA,
} from '../../../../actions/__tests__/utils/testUtil';
import {
  TEST_API_BASE_URL,
  renderWithRouterMatch,
} from '../../../../utils/testUtil';
import Properties from '../Properties';
import { getConfigOverlay } from '../../../../../js/mock/managementClientMSWHandlers';

const renderProperties = (
  component: React.ReactNode = <Properties objectMetadata={OBJECT_METADATA} />,
  state = {},
) => {
  return renderWithRouterMatch(
    component,
    {
      route: `/buckets/test/objects?prefix=${OBJECT_METADATA.objectKey}`,
      path: '/buckets/:bucketName/objects',
    },
    state,
  );
};

//Mock getObjectLockConfiguration for bucket 'bucket'
const server = setupServer(
  getConfigOverlay(TEST_API_BASE_URL, INSTANCE_ID),
  rest.get(`${TEST_API_BASE_URL}/bucket?object-lock`, (req, res, ctx) => {
    return res(
      ctx.xml(`
      <ObjectLockConfiguration>
        <ObjectLockEnabled>Enabled</ObjectLockEnabled>
        <Rule>
          <DefaultRetention>
            <Mode>COMPLIANCE</Mode>
            <Days>1</Days>
          </DefaultRetention>
        </Rule>
      </ObjectLockConfiguration>
      `),
    );
  }),
);

describe('Properties', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  it('should render', () => {
    renderProperties();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('should render expected values', () => {
    renderProperties();

    const labelsAndValues = [
      { label: 'Name', value: OBJECT_METADATA.objectKey },
      { label: 'Version ID', value: OBJECT_METADATA.versionId },
      { label: 'Size', value: '4.32 MiB' },
      { label: 'Modified On', value: '2020-10-16 10:06:54' },
      { label: 'Expires On', value: '2022-07-13 07:58:11' },
      { label: 'ETag', value: OBJECT_METADATA.eTag },
    ];

    expect(screen.getByText('Information')).toBeInTheDocument();

    labelsAndValues.forEach(({ label, value }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      // FIXME: find a better way to manage empty values
      if (value !== '') {
        expect(screen.getByText(label).parentElement).toHaveTextContent(value);
      }
    });
  });
  it('should render expected values when object is locked', async () => {
    renderProperties(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'LOCKED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: new Date('2020-10-17 10:06:54'),
          },
        }}
      />,
      {
        s3: {
          bucketInfo: {
            objectLockConfiguration: {
              ObjectLockEnabled: 'Enabled',
            },
          },
        },
      },
    );
    expect(screen.getByText('Lock')).toBeInTheDocument();
    expect(screen.getByText(/governance/)).toBeInTheDocument();
    expect(screen.getByText(/until 2020-10-17 10:06:54/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });
  it('should render expected values when lock is released', async () => {
    renderProperties(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'RELEASED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: new Date('2020-10-17 10:06:54'),
          },
        }}
      />,
    );

    expect(screen.getByText('Lock')).toBeInTheDocument();
    expect(
      screen.getByText(/Released since 2020-10-17 10:06:54/),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument(),
    );
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('should render expected legal hold value when the object lock is set', async () => {
    renderProperties(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'LOCKED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: new Date('2020-10-17 10:06:54'),
          },
          isLegalHoldEnabled: true,
        }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByText('Legal Hold')).toBeInTheDocument(),
    );
    expect(screen.getByText('Legal Hold')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument(); //Todo improve this check, later on we can have more than 1 thing being "Active"
  });

  it('should render expected location and temperature field if the location is cold location', async () => {
    renderProperties(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'LOCKED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: new Date('2020-10-17 10:06:54'),
          },
          isLegalHoldEnabled: true,
          storageClass: 'europe25-myroom-cold',
        }}
      />,
      {
        s3: {
          bucketInfo: {
            name: 'test-bucket',
            objectLockConfiguration: {
              ObjectLockEnabled: 'Enabled',
            },
            versioning: 'Enabled',
          },
        },
      },
    );

    await waitForElementToBeRemoved(() =>
      screen.getByText('Loading location information...'),
    );

    const labelsValues = [
      { label: 'Location', value: 'europe25-myroom-cold' },
      { label: 'Temperature', value: 'Cold' },
    ];

    labelsValues.forEach(({ label, value }) => {
      expect(screen.getByText(label)).toBeInTheDocument();
      expect(screen.getByText(label).parentElement).toHaveTextContent(value);
    });
  });

  it('should render restore in progress status and remove the restore button when the object is restoring from the cold location', async () => {
    renderProperties(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'LOCKED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: new Date('2020-10-17 10:06:54'),
          },
          isLegalHoldEnabled: true,
          storageClass: 'europe25-myroom-cold',
          restore: { ongoingRequest: true },
        }}
      />,
      {
        s3: {
          bucketInfo: {
            name: 'test-bucket',
            objectLockConfiguration: {
              ObjectLockEnabled: 'Enabled',
            },
            versioning: 'Enabled',
          },
        },
      },
    );

    await waitForElementToBeRemoved(() =>
      screen.getByText('Loading location information...'),
    );

    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Temperature').parentElement).toHaveTextContent(
      'Restoration in progress...',
    );

    expect(screen.queryByRole('button', { name: /restore/i })).toBeNull();
  });

  it('should render restored status and remove the restore button when the object is already restored from cold location', async () => {
    //mock the DateTime now
    //S
    const now = new Date();
    const oneDayAndOneHourInTheFutur = new Date(
      now.getTime() + 25 * 60 * 60 * 1000,
    );

    renderProperties(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'LOCKED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: new Date('2020-10-17 10:06:54'),
          },
          isLegalHoldEnabled: true,
          storageClass: 'europe25-myroom-cold',
          restore: {
            ongoingRequest: false,
            expiryDate: oneDayAndOneHourInTheFutur,
          },
        }}
      />,
      {
        s3: {
          bucketInfo: {
            name: 'test-bucket',
            objectLockConfiguration: {
              ObjectLockEnabled: 'Enabled',
            },
            versioning: 'Enabled',
          },
        },
      },
    );

    await waitForElementToBeRemoved(() =>
      screen.getByText('Loading location information...'),
    );

    //V
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('Temperature').parentElement).toHaveTextContent(
      'Restored (Expiring in 1 day)',
    );
  });
});
