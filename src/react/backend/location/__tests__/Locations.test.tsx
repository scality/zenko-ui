import Locations from '../Locations';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
} from '../../../utils/testUtil';
import { XDM_FEATURE } from '../../../../js/config';
import {
  screen,
  getAllByRole,
  getByRole,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { List } from 'immutable';
import {
  ACCOUNT_ID,
  getColdStorageHandlers,
} from '../../../../js/mock/managementClientMSWHandlers';
const locationFile = {
  details: {
    bootstrapList: [],
  },
  locationType: 'location-file-v1',
  name: 'location-file',
  objectId: '0',
  isBuiltin: true,
};
const locationAwsS3 = {
  details: {
    accessKey: 'accessKey1',
    bootstrapList: [],
    bucketMatch: true,
    bucketName: 'bucketName1',
    endpoint: 'http://aws.com',
    secretKey: 'secret',
  },
  locationType: 'location-aws-s3-v1',
  name: 'location-aws-s3',
  objectId: '1',
  sizeLimitGB: 123,
};
const locationCeph = {
  details: {
    accessKey: 'accessKey2',
    bootstrapList: [],
    bucketMatch: true,
    bucketName: 'bucketName2',
    endpoint: 'http://ceph.com',
    secretKey: 'secret',
  },
  locationType: 'location-ceph-radosgw-s3-v1',
  name: 'location-ceph',
  objectId: '2',
  sizeLimitGB: 123,
};
const locationNFS = {
  details: {
    bootstrapList: [],
    endpoint: 'tcp+v3://sever/coco?rw',
  },
  locationType: 'location-nfs-mount-v1',
  name: 'location-nfs',
  objectId: '3',
};
const locationHD = {
  details: {
    bootstrapList: ['localhost:123', 'localhost:456'],
  },
  locationType: 'location-scality-hdclient-v2',
  name: 'location-hd',
  objectId: '4',
};
const locationRing = {
  details: {
    accessKey: 'accessKey3',
    bootstrapList: [],
    bucketMatch: true,
    bucketName: 'bucketName3',
    endpoint: 'http://coco.com',
    secretKey: 'secret',
  },
  locationType: 'location-scality-ring-s3-v1',
  name: 'location-ring',
  objectId: '5',
  sizeLimitGB: 123,
};
const locationSproxyd = {
  details: {
    bootstrapList: ['localhost:123', 'localhost:456'],
    chordCos: 3,
    proxyPath: '/proxy/path/',
  },
  locationType: 'location-scality-sproxyd-v1',
  name: 'location-sproxyd',
  objectId: '6',
};
const locationDmf = {
  locationType: 'location-dmf-v1',
  name: 'europe25-myroom-cold',
  isCold: true,
  details: {
    endpoint: 'ws://tape.myroom.europe25.cnes:8181',
    repoId: ['repoId'],
    nsId: 'nsId',
    username: 'username',
    password: 'password',
  },
};
const locations = {
  'location-file': locationFile,
  'location-aws-s3': locationAwsS3,
  'location-ceph': locationCeph,
  'location-nfs': locationNFS,
  'location-hd': locationHD,
  'location-ring': locationRing,
  'location-sproxyd': locationSproxyd,
  'location-dmf': locationDmf,
};
const nbrOfColumnsExpected = 5;
const nbrOfColumnsExpectedWithoutXDM = 4;

const instanceId = 'instanceId';
const accountId = 'accountId';
const server = setupServer(
  rest.post(
    `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/account/${accountId}/workflow/search`,
    (req, res, ctx) => res(ctx.json([])),
  ),
  rest.get(
    `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/status`,
    (req, res, ctx) =>
      res(
        ctx.json({
          metrics: {
            ['crr-schedule']: { states: { ['location-dmf']: 'enabled' } },
            ['ingest-schedule']: { states: { ['location-dmf']: 'enabled' } },
          },
          state: null,
        }),
      ),
  ),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 800);
  jest.setTimeout(10_000);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

/// TODO : https://github.com/scality/zenko-ui/runs/5737214478?check_suite_focus=true for some reason the request is not intercepted by MSW in Github Actions
describe.skip('Locations', () => {
  it('should render Locations component alphabetically sorted', async () => {
    try {
      reduxRender(<Locations />, {
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

      await waitForElementToBeRemoved(
        () => [...screen.queryAllByText(/Checking if linked to workflows.../i)],
        { timeout: 8000 },
      );

      expect(screen.getAllByRole('columnheader').length).toEqual(
        nbrOfColumnsExpectedWithoutXDM,
      );
      /*********************************************************/
      const firstRow = screen.getAllByRole('row')[1];

      expect(screen.getByText('location-aws-s3')).toBeInTheDocument();
      expect(screen.getByText('Amazon S3')).toBeInTheDocument();
      expect(screen.getByText('bucketName1')).toBeInTheDocument();

      expect(
        getByRole(firstRow, 'button', {
          name: /Edit Location/i,
        }),
      ).not.toBeDisabled();

      expect(
        getByRole(firstRow, 'button', {
          name: /Delete Location/i,
        }),
      ).not.toBeDisabled();

      /*********************************************************/
      const secondRow = screen.getAllByRole('row')[2];
      const gridCellOfSecondRow = getAllByRole(secondRow, 'gridcell');
      expect(gridCellOfSecondRow.length).toEqual(
        nbrOfColumnsExpectedWithoutXDM,
      );

      expect(screen.getByText('location-ceph')).toBeInTheDocument();
      expect(screen.getByText('Ceph RADOS Gateway')).toBeInTheDocument();
      expect(screen.getByText('bucketName2')).toBeInTheDocument();

      expect(
        getByRole(secondRow, 'button', {
          name: /Edit Location/i,
        }),
      ).not.toBeDisabled();

      expect(
        getByRole(secondRow, 'button', {
          name: /Delete Location/i,
        }),
      ).not.toBeDisabled();
      /*********************************************************/
      const thirdRow = screen.getAllByRole('row')[3];
      const gridCellOfThirdRow = getAllByRole(thirdRow, 'gridcell');
      expect(gridCellOfThirdRow.length).toEqual(nbrOfColumnsExpectedWithoutXDM);

      expect(screen.getByText('location-file')).toBeInTheDocument();
      expect(screen.getByText('Local Filesystem')).toBeInTheDocument();

      expect(
        getByRole(thirdRow, 'button', {
          name: /Edit Location/i,
        }),
      ).toBeDisabled();

      expect(
        getByRole(thirdRow, 'button', {
          name: /Delete Location/i,
        }),
      ).toBeDisabled();
      /*********************************************************/
      const fourthRow = screen.getAllByRole('row')[4];
      const gridCellOfFourthRow = getAllByRole(fourthRow, 'gridcell');
      expect(gridCellOfFourthRow.length).toEqual(
        nbrOfColumnsExpectedWithoutXDM,
      );

      expect(screen.getByText('location-hd')).toBeInTheDocument();
      expect(
        screen.getByText('Storage Service for ARTESCA'),
      ).toBeInTheDocument();

      expect(
        getByRole(fourthRow, 'button', {
          name: /Edit Location/i,
        }),
      ).not.toBeDisabled();

      expect(
        getByRole(fourthRow, 'button', {
          name: /Delete Location/i,
        }),
      ).not.toBeDisabled();
      /*********************************************************/
      const fifthRow = screen.getAllByRole('row')[5];
      const gridCellOfFifthRow = getAllByRole(fifthRow, 'gridcell');
      expect(gridCellOfFifthRow.length).toEqual(nbrOfColumnsExpectedWithoutXDM);

      expect(screen.getByText('location-nfs')).toBeInTheDocument();
      expect(screen.getByText('NFS Mount')).toBeInTheDocument();

      expect(
        getByRole(fifthRow, 'button', {
          name: /Edit Location/i,
        }),
      ).not.toBeDisabled();

      expect(
        getByRole(fifthRow, 'button', {
          name: /Delete Location/i,
        }),
      ).not.toBeDisabled();
      /*********************************************************/
      const sixthRow = screen.getAllByRole('row')[6];
      const gridCellOfSixthRow = getAllByRole(sixthRow, 'gridcell');
      expect(gridCellOfSixthRow.length).toEqual(nbrOfColumnsExpectedWithoutXDM);

      expect(screen.getByText('location-ring')).toBeInTheDocument();
      expect(
        screen.getByText('Scality RING with S3 Connector'),
      ).toBeInTheDocument();
      expect(screen.getByText('bucketName3')).toBeInTheDocument();

      expect(
        getByRole(sixthRow, 'button', {
          name: /Edit Location/i,
        }),
      ).not.toBeDisabled();

      expect(
        getByRole(sixthRow, 'button', {
          name: /Delete Location/i,
        }),
      ).not.toBeDisabled();
      /*********************************************************/
      const seventhRow = screen.getAllByRole('row')[7];
      const gridCellOfSeventhRow = getAllByRole(seventhRow, 'gridcell');
      expect(gridCellOfSeventhRow.length).toEqual(
        nbrOfColumnsExpectedWithoutXDM,
      );

      expect(screen.getByText('location-sproxyd')).toBeInTheDocument();
      expect(
        screen.getByText('Scality RING with Sproxyd Connector'),
      ).toBeInTheDocument();

      expect(
        getByRole(seventhRow, 'button', {
          name: /Edit Location/i,
        }),
      ).not.toBeDisabled();

      expect(
        getByRole(seventhRow, 'button', {
          name: /Delete Location/i,
        }),
      ).not.toBeDisabled();
    } catch (e) {
      console.log('should render Locations component alphabetically sorted', e);
      throw e;
    }
  });
  it('should disable delete location button if location is being used for replication when XDM feature is disabled', async () => {
    try {
      server.use(
        rest.post(
          `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/account/${accountId}/workflow/search`,
          (req, res, ctx) =>
            res(
              ctx.json([
                {
                  replication: {
                    destination: { locations: [{ name: 'location-aws-s3' }] },
                    name: null,
                    source: {
                      bucketName: 'test-post-react-hook-form',
                      prefix: 'tester',
                    },
                    streamId: '0d55a1d7-349c-4e79-932b-a502bcc45a8f',
                    version: null,
                  },
                },
              ]),
            ),
        ),
      );

      reduxRender(<Locations />, {
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
            locations: {
              'location-aws-s3': locationAwsS3,
            },
            endpoints: [],
          },
        },
      });

      await waitForElementToBeRemoved(
        () => [...screen.queryAllByText(/Checking if linked to workflows.../i)],
        { timeout: 8000 },
      );

      expect(screen.getAllByRole('row')).toHaveLength(2);

      expect(screen.getByText('Location Name')).toBeInTheDocument();
      expect(screen.getByText('Location Type')).toBeInTheDocument();
      expect(screen.getByText('Target Bucket')).toBeInTheDocument();

      expect(screen.getAllByRole('columnheader').length).toEqual(
        nbrOfColumnsExpectedWithoutXDM,
      );

      expect(screen.getByText('location-aws-s3')).toBeInTheDocument();
      expect(screen.getByText('Amazon S3')).toBeInTheDocument();
      expect(screen.getByText('bucketName1')).toBeInTheDocument();

      const firstRow = screen.getAllByRole('row')[1];

      expect(
        getByRole(firstRow, 'button', {
          name: /Edit Location/i,
        }),
      ).not.toBeDisabled();

      expect(
        getByRole(firstRow, 'button', {
          name: /Delete Location/i,
        }),
      ).toBeDisabled();
    } catch (e) {
      console.log(
        'should disable delete location button if location is being used for replication when XDM feature is disabled',
        e,
      );
      throw e;
    }
  });
  it('should disable delete location button if location is being used for replication when XDM feature is enabled', async () => {
    try {
      server.use(
        rest.post(
          `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/account/${accountId}/workflow/search`,
          (req, res, ctx) =>
            res(
              ctx.json([
                {
                  replication: {
                    destination: { locations: [{ name: 'location-aws-s3' }] },
                    name: null,
                    source: {
                      bucketName: 'test-post-react-hook-form',
                      prefix: 'tester',
                    },
                    streamId: '0d55a1d7-349c-4e79-932b-a502bcc45a8f',
                    version: null,
                  },
                },
              ]),
            ),
        ),
      );

      reduxRender(<Locations />, {
        networkActivity: {
          counter: 0,
          messages: List.of(),
        },
        instances: {
          selectedId: instanceId,
        },
        auth: {
          config: {
            features: [XDM_FEATURE],
          },
          selectedAccount: { id: accountId },
        },
        configuration: {
          latest: {
            locations: {
              'location-aws-s3': locationAwsS3,
            },
            endpoints: [],
          },
        },
      });

      await waitForElementToBeRemoved(
        () => [...screen.queryAllByText(/Checking if linked to workflows.../i)],
        { timeout: 8000 },
      );

      expect(screen.getAllByRole('row')).toHaveLength(2);

      expect(screen.getByText('Location Name')).toBeInTheDocument();
      expect(screen.getByText('Location Type')).toBeInTheDocument();
      expect(screen.getByText('Target Bucket')).toBeInTheDocument();
      expect(screen.getByText('Async Metadata updates')).toBeInTheDocument();

      expect(screen.getAllByRole('columnheader').length).toEqual(
        nbrOfColumnsExpected,
      );
      expect(screen.getByText('location-aws-s3')).toBeInTheDocument();
      expect(screen.getByText('Amazon S3')).toBeInTheDocument();
      expect(screen.getByText('bucketName1')).toBeInTheDocument();

      const firstRow = screen.getAllByRole('row')[1];

      expect(
        getByRole(firstRow, 'button', {
          name: /Edit Location/i,
        }),
      ).not.toBeDisabled();

      expect(
        getByRole(firstRow, 'button', {
          name: /Delete Location/i,
        }),
      ).toBeDisabled();
    } catch (e) {
      console.log(
        'should disable delete location button if location is being used for replication when XDM feature is enabled',
        e,
      );
      throw e;
    }
  });
  it('should disable delete location button if location is attached to a bucket', async () => {
    try {
      reduxRender(<Locations />, {
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
            locations: {
              'location-aws-s3': locationAwsS3,
            },
            endpoints: [],
          },
        },
        stats: {
          bucketList: [
            {
              name: 'bucket1',
              location: 'location-aws-s3',
            },
          ],
        },
      });

      await waitForElementToBeRemoved(
        () => [...screen.queryAllByText(/Checking if linked to workflows.../i)],
        { timeout: 8000 },
      );

      expect(screen.getAllByRole('row')).toHaveLength(2);

      expect(screen.getAllByRole('columnheader').length).toEqual(
        nbrOfColumnsExpectedWithoutXDM,
      );

      expect(screen.getByText('location-aws-s3')).toBeInTheDocument();
      expect(screen.getByText('Amazon S3')).toBeInTheDocument();
      expect(screen.getByText('bucketName1')).toBeInTheDocument();

      const firstRow = screen.getAllByRole('row')[1];

      expect(
        getByRole(firstRow, 'button', {
          name: /Edit Location/i,
        }),
      ).not.toBeDisabled();

      expect(
        getByRole(firstRow, 'button', {
          name: /Delete Location/i,
        }),
      ).toBeDisabled();
    } catch (e) {
      console.log(
        'should disable delete location button if location is attached to a bucket',
        e,
      );
      throw e;
    }
  });
  it('should disable delete location button if location is being used for endpoint', async () => {
    try {
      reduxRender(<Locations />, {
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
            locations: {
              'location-aws-s3': locationAwsS3,
            },
            endpoints: [
              {
                hostname: 'host1',
                locationName: 'location-aws-s3',
              },
            ],
          },
        },
      });

      await waitForElementToBeRemoved(
        () => [...screen.queryAllByText(/Checking if linked to workflows.../i)],
        { timeout: 8000 },
      );

      expect(screen.getAllByRole('row')).toHaveLength(2);

      expect(screen.getAllByRole('columnheader').length).toEqual(
        nbrOfColumnsExpectedWithoutXDM,
      );

      expect(screen.getByText('location-aws-s3')).toBeInTheDocument();
      expect(screen.getByText('Amazon S3')).toBeInTheDocument();
      expect(screen.getByText('bucketName1')).toBeInTheDocument();

      const firstRow = screen.getAllByRole('row')[1];

      expect(
        getByRole(firstRow, 'button', {
          name: /Edit Location/i,
        }),
      ).not.toBeDisabled();

      expect(
        getByRole(firstRow, 'button', {
          name: /Delete Location/i,
        }),
      ).toBeDisabled();
    } catch (e) {
      console.log(
        'should disable delete location button if location is being used for endpoint',
        e,
      );
      throw e;
    }
  });

  it('should disable delete location button if transition workflow is created on it', async () => {
    const TEST_ACCOUNT = 'Test Account';
    const TEST_ACCOUNT_CREATION_DATE = '2022-03-18T12:51:44Z';

    server.use(
      rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
        return res(
          ctx.json({
            IsTruncated: false,
            Accounts: [
              {
                Name: TEST_ACCOUNT,
                CreationDate: TEST_ACCOUNT_CREATION_DATE,
                Roles: [
                  {
                    Name: 'storage-manager-role',
                    Arn: `arn:aws:iam::${ACCOUNT_ID}:role/scality-internal/storage-manager-role`,
                  },
                ],
              },
            ],
          }),
        );
      }),
      ...getColdStorageHandlers(TEST_API_BASE_URL, instanceId),
    );
    reduxRender(<Locations />, {
      networkActivity: {
        counter: 0,
        messages: List.of(),
      },
      instances: {
        selectedId: instanceId,
      },
      auth: {
        config: { features: [], iamEndpoint: TEST_API_BASE_URL },
        selectedAccount: { id: ACCOUNT_ID },
      },
      configuration: {
        latest: {
          locations: {
            'location-dmf': locationDmf,
          },
        },
      },
    });

    await waitForElementToBeRemoved(
      () => [...screen.queryAllByText(/Checking if linked to workflows.../i)],
      { timeout: 8000 },
    );

    const firstRow = screen.getAllByRole('row')[1];

    expect(
      getByRole(firstRow, 'button', {
        name: /You can't delete this location/i,
      }),
    ).toBeDisabled();
  });
});
