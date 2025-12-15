import {
  ConstrainedText,
  Icon,
  Text,
  Toast,
  Toggle,
  Tooltip,
} from '@scality/core-ui';
import { SmallerText } from '@scality/core-ui/dist/components/text/Text.component';
import { useDispatch, useSelector } from 'react-redux';

import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { useEffect, useState } from 'react';
import { XDM_FEATURE } from '../../../../js/config';
import { LocationV1 } from '../../../../js/managementClient/api';
import { BucketInfo } from '../../../../types/s3';
import { AppState } from '../../../../types/state';
import { ScheduleUnitState } from '../../../../types/stats';
import { useCurrentAccount } from '../../../DataServiceRoleProvider';
import { getBucketInfo, toggleBucketVersioning } from '../../../actions';
import { useAccountsLocationsAndEndpoints } from '../../../next-architecture/domain/business/accounts';
import {
  useBucketTagging,
  useChangeBucketVersionning,
} from '../../../next-architecture/domain/business/buckets';
import { Bucket } from '../../../next-architecture/domain/entities/bucket';
import { useAccountsLocationsEndpointsAdapter } from '../../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useConfig } from '../../../next-architecture/ui/ConfigProvider';
import { ButtonContainer } from '../../../ui-elements/Container';
import { DeleteBucket } from '../../../ui-elements/DeleteBucket';
import { EmptyBucket } from '../../../ui-elements/EmptyBucket';
import { HelpAsyncNotification } from '../../../ui-elements/Help';
import { TableContainer } from '../../../ui-elements/Table';
import Table, * as T from '../../../ui-elements/TableKeyValue2';
import { VeeamCapacityOverviewRow } from '../../../ISV/modules/veeam/components/VeeamCapacityOverviewRow';

import { maybePluralize } from '../../../utils';
import {
  getLocationIngestionState,
  getLocationType,
} from '../../../utils/storageOptions';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import {
  BUCKET_TAG_APPLICATION,
  BUCKET_TAG_VEEAM_APPLICATION,
  COMMVAULT_APPLICATION,
  VEEAM_BACKUP_REPLICATION,
} from '../../../ISV/constants';
import { VeeamApplicationType } from '../../../ISV/constants';
import { VEEAM_VBO_APPLICATION } from '../../../ISV/modules/veeam-vbo';

function capitalize(string: string) {
  return string.toLowerCase().replace(/^\w/, (c) => {
    return c.toUpperCase();
  });
}

function getDefaultBucketRetention(bucketInfo: BucketInfo): string {
  if (
    bucketInfo.objectLockConfiguration.Rule &&
    bucketInfo.objectLockConfiguration.Rule.DefaultRetention
  ) {
    const retentionPeriod = bucketInfo.objectLockConfiguration.Rule
      .DefaultRetention.Days
      ? bucketInfo.objectLockConfiguration.Rule.DefaultRetention.Days + ' days'
      : bucketInfo.objectLockConfiguration.Rule.DefaultRetention.Years
      ? bucketInfo.objectLockConfiguration.Rule.DefaultRetention.Years +
        ' years'
      : '';
    return `${capitalize(
      bucketInfo.objectLockConfiguration.Rule.DefaultRetention.Mode,
    )} - ${retentionPeriod}`;
  }

  return 'Inactive';
}

type Props = {
  bucket: Bucket;
  ingestionStates: ScheduleUnitState | null | undefined;
};


function VersionningValue({
  bucketInfo,
  isVeeamBucket,
}: {
  bucketInfo: BucketInfo;
  isVeeamBucket: boolean;
}) {
  const dispatch = useDispatch();
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { accountsLocationsAndEndpoints, status: locationsStatus } =
    useAccountsLocationsAndEndpoints({ accountsLocationsEndpointsAdapter });
  const locationType = accountsLocationsAndEndpoints?.locations.find(
    (location) => location.name === bucketInfo.locationConstraint,
  )?.type;
  const isBucketHostedOnAzureOrGCP =
    locationType === LocationV1.LocationTypeEnum.AzureV1 ||
    locationType === LocationV1.LocationTypeEnum.GcpV1;
  const { mutate: changeBucketVersionning } = useChangeBucketVersionning();
  const updateBucketVersioning = (isVersioning: boolean) => {
    changeBucketVersionning({
      Bucket: bucketInfo.name,
      VersioningConfiguration: {
        Status: isVersioning ? 'Enabled' : 'Disabled',
      },
    });
  };
  const isVersioningToggleDisabled =
    locationsStatus === 'idle' ||
    locationsStatus === 'loading' ||
    isBucketHostedOnAzureOrGCP ||
    isVeeamBucket;

  return (
    <T.Value>
      {bucketInfo.objectLockConfiguration.ObjectLockEnabled === 'Disabled' && (
        <Tooltip
          overlay={
            locationType === LocationV1.LocationTypeEnum.AzureV1 ? (
              <>
                Enabling versioning is not possible due to the bucket being
                hosted on Microsoft Azure.
              </>
            ) : locationType === LocationV1.LocationTypeEnum.GcpV1 ? (
              <>
                Enabling versioning is not possible due to the bucket being
                hosted on Google Cloud.
              </>
            ) : isVeeamBucket ? (
              <>
                Enabling versioning is not possible due to the bucket being
                managed by Veeam.
              </>
            ) : null
          }
        >
          <Toggle
            id="versioningToggle"
            disabled={isVersioningToggleDisabled}
            toggle={bucketInfo.isVersioning}
            label={
              bucketInfo.versioning === 'Enabled'
                ? 'Active'
                : bucketInfo.versioning === 'Disabled'
                ? 'Inactive'
                : bucketInfo.versioning
            }
            onChange={() => {
              dispatch(
                toggleBucketVersioning(
                  bucketInfo.name,
                  !bucketInfo.isVersioning,
                ),
              );
              updateBucketVersioning(!bucketInfo.isVersioning);
            }}
          />
        </Tooltip>
      )}
      {bucketInfo.objectLockConfiguration.ObjectLockEnabled === 'Enabled' && (
        <>
          Enabled
          <br />
          <SmallerText>
            Versioning cannot be suspended because Object-lock is enabled for
            this bucket.
          </SmallerText>
        </>
      )}
    </T.Value>
  );
}

function LocationType({ location: locationName }: { location: string }) {
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { accountsLocationsAndEndpoints, status: locationsStatus } =
    useAccountsLocationsAndEndpoints({ accountsLocationsEndpointsAdapter });
  const locationObject = accountsLocationsAndEndpoints?.locations.find(
    (location) => location.name === locationName,
  );
  if (locationsStatus === 'loading' || locationsStatus === 'idle') {
    return <small>Loading...</small>;
  }
  if (locationsStatus === 'error') {
    return (
      <>
        <Toast
          open
          autoDismiss
          onClose={() => {
            return;
          }}
          message={
            <Text>
              An error occured while loading locations, this can affect
              displaying the bucket location
            </Text>
          }
          status="error"
        />
        <small>Error</small>
      </>
    );
  }
  if (!locationObject) {
    return <small>Location not found: {locationName}</small>;
  }
  return <small>{getLocationType(locationObject)}</small>;
}

function Overview({ bucket, ingestionStates }: Props) {
  const navigate = useBasenameRelativeNavigate();
  const dispatch = useDispatch();
  const bucketInfo = useSelector((state: AppState) => state.s3.bucketInfo);
  const { features } = useConfig();
  const { account } = useCurrentAccount();
  const [bucketTaggingToast, setBucketTaggingToast] = useState(true);
  const { tags } = useBucketTagging({ bucketName: bucket.name });

  // Keep this to avoid breaking changes
  const veeamTagApplication =
    tags.status === 'success' && tags.value?.[BUCKET_TAG_VEEAM_APPLICATION];
  // New tag for ISV application
  const ISVApplicationTag =
    tags.status === 'success' && tags.value?.[BUCKET_TAG_APPLICATION];

  const isVeeamBucket =
    veeamTagApplication === VeeamApplicationType.VEEAM_BACKUP_REPLICATION ||
    veeamTagApplication === VeeamApplicationType.VEEAM_OFFICE_365 ||
    veeamTagApplication === VeeamApplicationType.VEEAM_OFFICE_365_V8;
  const isISVBucketTagAsVeeam =
    ISVApplicationTag === VEEAM_BACKUP_REPLICATION ||
    ISVApplicationTag === VEEAM_VBO_APPLICATION;
  const isISVCommvault = ISVApplicationTag === COMMVAULT_APPLICATION;

  useEffect(() => {
    dispatch(getBucketInfo(bucket.name));
  }, [dispatch, bucket.name]);

  if (!bucketInfo) {
    return null;
  }

  const { value: ingestionValue, isIngestion } = getLocationIngestionState(
    ingestionStates,
    bucketInfo.locationConstraint || 'us-east-1',
  );

  return (
    <TableContainer>
      <Toast
        message="Encountered issues loading bucket tagging, causing uncertainty about the use-case. Please refresh the page."
        open={tags.status === 'error' && bucketTaggingToast}
        status="error"
        onClose={() => {
          setBucketTaggingToast(false);
        }}
      />
      <ButtonContainer>
        <EmptyBucket bucketName={bucket.name} />
        <DeleteBucket bucketName={bucket.name} />
      </ButtonContainer>
      <Table>
        <T.Body>
          <T.Group>
            <T.GroupName>General</T.GroupName>
            <T.GroupContent>
              <T.Row>
                <T.Key> Name </T.Key>
                <T.Value width="15rem">
                  <ConstrainedText text={bucketInfo.name} lineClamp={2} />
                </T.Value>
              </T.Row>
              <T.Row>
                <T.Key> Versioning </T.Key>
                <VersionningValue
                  bucketInfo={bucketInfo}
                  isVeeamBucket={isVeeamBucket || isISVBucketTagAsVeeam}
                />
              </T.Row>
              <T.Row>
                <T.Key> Location </T.Key>
                <T.Value>
                  {bucketInfo.locationConstraint || 'us-east-1'}
                  {' / '}
                  <LocationType
                    location={bucketInfo.locationConstraint || 'us-east-1'}
                  />
                </T.Value>
              </T.Row>
              {features.includes(XDM_FEATURE) && (
                <T.Row>
                  <T.Key> Async Metadata updates </T.Key>
                  <T.Value>
                    {ingestionValue}
                    {isIngestion && <HelpAsyncNotification />}
                  </T.Value>
                </T.Row>
              )}
            </T.GroupContent>
          </T.Group>

          <T.Group>
            <T.GroupName> Use-case </T.GroupName>
            <T.Row>
              <T.Key> Application </T.Key>
              <T.Value>
                {isISVBucketTagAsVeeam || isVeeamBucket
                  ? `${ISVApplicationTag || veeamTagApplication}`
                  : ISVApplicationTag || 'S3 Generic'}
              </T.Value>
            </T.Row>
            {(ISVApplicationTag === VEEAM_BACKUP_REPLICATION ||
              veeamTagApplication === VEEAM_BACKUP_REPLICATION) && (
              <VeeamCapacityOverviewRow bucketName={bucket.name} />
            )}
          </T.Group>

          <T.Group>
            <T.GroupName> Data protection </T.GroupName>
            <T.GroupContent>
              {bucketInfo.objectLockConfiguration.ObjectLockEnabled ===
                'Enabled' && (
                <>
                  <T.Row>
                    <T.Key> Object-lock </T.Key>
                    <T.Value aria-label="indicate if object lock is enabled">
                      Enabled
                    </T.Value>
                  </T.Row>
                  <T.Row>
                    <T.Key> Default Object-lock Retention </T.Key>
                    <T.GroupValues>
                      <div>{getDefaultBucketRetention(bucketInfo)}</div>
                      {tags.status === 'success' && (
                        <Button
                          id="edit-retention-btn"
                          variant="outline"
                          label="Edit"
                          aria-label="Edit default retention"
                          icon={<Icon name="Pencil" />}
                          type="button"
                          onClick={() => {
                            navigate(
                              `/accounts/${account?.Name}/buckets/${bucket.name}/retention-setting`,
                            );
                          }}
                          disabled={
                            isVeeamBucket ||
                            isISVBucketTagAsVeeam ||
                            isISVCommvault
                          }
                          tooltip={{
                            overlay: isISVCommvault
                              ? 'Edition is disabled as it is managed by Commvault.'
                              : isVeeamBucket || isISVBucketTagAsVeeam
                              ? 'Edition is disabled as it is managed by Veeam.'
                              : '',
                          }}
                        />
                      )}
                    </T.GroupValues>
                  </T.Row>
                </>
              )}
              {bucketInfo.objectLockConfiguration.ObjectLockEnabled ===
                'Disabled' && (
                <T.Row>
                  <T.Key>Object-lock</T.Key>
                  <T.Value>Disabled</T.Value>
                </T.Row>
              )}
            </T.GroupContent>
          </T.Group>
          <T.Group>
            <T.GroupName>Permissions</T.GroupName>
            <T.GroupContent>
              <T.Row>
                <T.Key> Owner </T.Key>
                <T.Value> {bucketInfo.owner} </T.Value>
              </T.Row>
              <T.Row>
                <T.Key> ACL </T.Key>
                <T.Value>
                  {maybePluralize(bucketInfo.aclGrantees, 'Grantee')}
                </T.Value>
              </T.Row>
              <T.Row>
                <T.Key> CORS </T.Key>
                <T.Value>{bucketInfo.cors ? 'Yes' : 'No'}</T.Value>
              </T.Row>
              <T.Row>
                <T.Key> Public </T.Key>
                <T.Value>{bucketInfo.public ? 'Yes' : 'No'}</T.Value>
              </T.Row>
            </T.GroupContent>
          </T.Group>
        </T.Body>
      </Table>
    </TableContainer>
  );
}

export default Overview;
