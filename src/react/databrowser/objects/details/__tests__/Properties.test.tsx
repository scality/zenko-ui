import { OBJECT_METADATA } from '../../../../actions/__tests__/utils/testUtil';
import {
  TEST_API_BASE_URL,
  reduxMount,
  reduxRender,
} from '../../../../utils/testUtil';
import * as T from '../../../../ui-elements/TableKeyValue2';
import MiddleEllipsis from '../../../../ui-elements/MiddleEllipsis';
import Properties from '../Properties';
import router from 'react-router';
import { DateTime } from 'luxon';

import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { screen, waitFor } from '@testing-library/react';

//Mock getObjectLockConfiguration for bucket 'bucket'
const server = setupServer(
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
    jest.spyOn(router, 'useLocation').mockReturnValue({
      pathname: `/buckets/test/objects?prefix=${OBJECT_METADATA.objectKey}`,
    });
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  it('should render', () => {
    jest.spyOn(router, 'useParams').mockReturnValue({
      '0': undefined,
    });
    const { component } = reduxMount(
      <Properties objectMetadata={OBJECT_METADATA} />,
    );
    expect(component.find(Properties).isEmptyRender()).toBe(false);
  });
  it('should render expected values', () => {
    const { component } = reduxMount(
      <Properties objectMetadata={OBJECT_METADATA} />,
    );
    const groupInfos = component.find(T.Group);
    expect(groupInfos).toHaveLength(2);
    // FIRST GROUP ITEMS TITLE
    const firstGroupInfos = groupInfos.first();
    expect(firstGroupInfos.find(T.GroupName).text()).toContain('Information');
    // FIRST GROUP ITEMS
    const firstGroupInfosContentItems = firstGroupInfos
      .find(T.GroupContent)
      .find(T.Row);
    const firstItemFirstGroup = firstGroupInfosContentItems.first();
    expect(firstItemFirstGroup.find(T.Key).text()).toContain('Name');
    expect(firstItemFirstGroup.find(T.Value).text()).toContain(
      OBJECT_METADATA.objectKey,
    );
    const secondItemFirstGroup = firstGroupInfosContentItems.at(1);
    expect(secondItemFirstGroup.find(T.Key).text()).toContain('Version ID');
    expect(secondItemFirstGroup.find(MiddleEllipsis).text()).toContain(
      OBJECT_METADATA.versionId,
    );
    const thirdItemFirstGroup = firstGroupInfosContentItems.at(2);
    expect(thirdItemFirstGroup.find(T.Key).text()).toContain('Size');
    expect(thirdItemFirstGroup.find(T.Value).text()).toContain('4.32 MiB');
    const fourthItemFirstGroup = firstGroupInfosContentItems.at(3);
    expect(fourthItemFirstGroup.find(T.Key).text()).toContain('Modified On');
    expect(fourthItemFirstGroup.find(T.Value).text()).toContain(
      '2020-10-16 10:06:54',
    );
    const fifthItemFirstGroup = firstGroupInfosContentItems.at(4);
    expect(fifthItemFirstGroup.find(T.Key).text()).toContain('Expires On');
    expect(fifthItemFirstGroup.find(T.Value).text()).toContain(
      '2022-07-13 07:58:11',
    );
    const sixthItemFirstGroup = firstGroupInfosContentItems.at(5);
    expect(sixthItemFirstGroup.find(T.Key).text()).toContain('ETag');
    expect(sixthItemFirstGroup.find(T.GroupValues).text()).toContain(
      OBJECT_METADATA.eTag,
    );
  });
  it('should render expected values when object is locked', async () => {
    reduxRender(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'LOCKED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: '2020-10-17 10:06:54',
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
    reduxRender(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'RELEASED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: '2020-10-17 10:06:54',
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
    reduxRender(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'LOCKED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: '2020-10-17 10:06:54',
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
    const { component } = reduxMount(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'LOCKED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: '2020-10-17 10:06:54',
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
        configuration: {
          latest: {
            locations: {
              ['europe25-myroom-cold']: {
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
              },
            },
          },
        },
      },
    );
    const tableItems = component.find(T.Row);
    const sixth = tableItems.at(6);
    expect(sixth.find(T.Key).text()).toContain('Location');
    expect(sixth.find(T.Value).text()).toContain('europe25-myroom-cold');
    const seventh = tableItems.at(7);
    expect(seventh.find(T.Key).text()).toContain('Temperature');
    expect(seventh.find(T.GroupValues).text()).toContain('Cold');
  });

  it('should render restore in progress status and remove the restore button when the object is restoring from the cold location', async () => {
    const { component } = reduxMount(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'LOCKED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: '2020-10-17 10:06:54',
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
        configuration: {
          latest: {
            locations: {
              ['europe25-myroom-cold']: {
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
              },
            },
          },
        },
      },
    );
    const tableItems = component.find(T.Row);
    const seventh = tableItems.at(7);
    expect(seventh.find(T.Key).text()).toContain('Temperature');
    expect(seventh.find(T.GroupValues).text()).toContain(
      'Restoration in progress...',
    );
    expect(seventh.find('button#restore-button').exists()).toBeFalsy();
  });

  it('should render restored status and remove the restore button when the object is already restored from cold location', async () => {
    //mock the DateTime now
    //S
    const now = new Date();
    const oneDayAndOneHourInTheFutur = new Date(
      now.getTime() + 25 * 60 * 60 * 1000,
    );

    const { component } = reduxMount(
      <Properties
        objectMetadata={{
          ...OBJECT_METADATA,
          lockStatus: 'LOCKED',
          objectRetention: {
            mode: 'GOVERNANCE',
            retainUntilDate: '2020-10-17 10:06:54',
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
        configuration: {
          latest: {
            locations: {
              ['europe25-myroom-cold']: {
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
              },
            },
          },
        },
      },
    );
    //V
    const tableItems = component.find(T.Row);
    const seventh = tableItems.at(7);
    expect(seventh.find(T.Key).text()).toContain('Temperature');
    expect(seventh.find(T.GroupValues).text()).toContain(
      'Restored (Expiring in 1 day)',
    );
  });
});
