import { ConstrainedText, Icon, Toggle, Tooltip } from '@scality/core-ui';
import { SmallerText } from '@scality/core-ui/dist/components/text/Text.component';
import { Button } from '@scality/core-ui/dist/next';
import { push } from 'connected-react-router';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { XDM_FEATURE } from '../../../../js/config';
import type { BucketInfo } from '../../../../types/s3';
import type { AppState } from '../../../../types/state';
import type { WorkflowScheduleUnitState } from '../../../../types/stats';
import { useCurrentAccount } from '../../../DataServiceRoleProvider';
import { getBucketInfo, toggleBucketVersioning } from '../../../actions';
import { useChangeBucketVersionning } from '../../../next-architecture/domain/business/buckets';
import { Bucket } from '../../../next-architecture/domain/entities/bucket';
import { ButtonContainer } from '../../../ui-elements/Container';
import { DeleteBucket } from '../../../ui-elements/DeleteBucket';
import { EmptyBucket } from '../../../ui-elements/EmptyBucket';
import { DumbErrorModal } from '../../../ui-elements/ErrorHandlerModal';
import { HelpAsyncNotification } from '../../../ui-elements/Help';
import { CellLink, TableContainer } from '../../../ui-elements/Table';
import Table, * as T from '../../../ui-elements/TableKeyValue2';
import { maybePluralize } from '../../../utils';
import {
  getLocationIngestionState,
  getLocationType,
} from '../../../utils/storageOptions';
import { useWorkflows } from '../../../workflow/Workflows';

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
  ingestionStates: WorkflowScheduleUnitState | null | undefined;
};

const workflowAttachedError = (count: number, bucketName: string) => (
  <div>
    The bucket you tried to delete has{' '}
    {maybePluralize(count, 'workflow', 's', true)} attached to it, you should{' '}
    <CellLink
      to={{
        pathname: `/workflows`,
        search: `?search=${bucketName}`,
      }}
    >
      delete
    </CellLink>{' '}
    {count > 1 ? 'them' : 'it'} first.
  </div>
);

function Overview({ bucket, ingestionStates }: Props) {
  const dispatch = useDispatch();
  const bucketInfo = useSelector((state: AppState) => state.s3.bucketInfo);
  const locations = useSelector(
    (state: AppState) => state.configuration.latest?.locations,
  );
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );
  const workflowsQuery = useWorkflows([bucket.name]);
  const features = useSelector((state: AppState) => state.auth.config.features);
  const { account } = useCurrentAccount();
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const { mutate: changeBucketVersionning } = useChangeBucketVersionning();

  useEffect(() => {
    dispatch(getBucketInfo(bucket.name));
  }, [dispatch, bucket.name]);

  const workflows = workflowsQuery.data;
  const attachedWorkflowsCount =
    (workflows?.expirations?.length || 0) +
    (workflows?.replications.length || 0) +
    (workflows?.transitions.length || 0);

  if (!bucketInfo) {
    return null;
  }

  const { value: ingestionValue, isIngestion } = getLocationIngestionState(
    ingestionStates,
    bucketInfo.locationConstraint || 'us-east-1',
  );
  const locationType =
    locations && locations[bucketInfo.locationConstraint]?.locationType;
  const isBucketHostedOnAzureOrGCP =
    locationType === 'location-azure-v1' || locationType === 'location-gcp-v1';

  const updateBucketVersioning = (isVersioning: boolean) => {
    changeBucketVersionning({
      Bucket: bucketInfo.name,
      VersioningConfiguration: {
        Status: isVersioning ? 'Enabled' : 'Disabled',
      },
    });
  };

  return (
    <TableContainer>
      <DumbErrorModal
        isOpen={isErrorModalOpen}
        close={() => {
          setIsErrorModalOpen(false);
        }}
        errorMessage={
          isErrorModalOpen
            ? workflowAttachedError(attachedWorkflowsCount, bucket.name)
            : null
        }
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
                <T.Value>
                  {bucketInfo.objectLockConfiguration.ObjectLockEnabled ===
                    'Disabled' && (
                    <Tooltip
                      overlay={
                        locationType === 'location-azure-v1' ? (
                          <>
                            Enabling versioning is not possible due to the
                            bucket being hosted on Microsoft Azure.
                          </>
                        ) : locationType === 'location-gcp-v1' ? (
                          <>
                            Enabling versioning is not possible due to the
                            bucket being hosted on Google Cloud.
                          </>
                        ) : (
                          <></>
                        )
                      }
                    >
                      <Toggle
                        disabled={loading || isBucketHostedOnAzureOrGCP}
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
                              bucket.name,
                              !bucketInfo.isVersioning,
                            ),
                          );
                          updateBucketVersioning(!bucketInfo.isVersioning);
                        }}
                      />
                    </Tooltip>
                  )}
                  {bucketInfo.objectLockConfiguration.ObjectLockEnabled ===
                    'Enabled' && (
                    <>
                      Enabled
                      <br />
                      <SmallerText>
                        Versioning cannot be suspended because Object-lock is
                        enabled for this bucket.
                      </SmallerText>
                    </>
                  )}
                </T.Value>
              </T.Row>
              {bucketInfo.objectLockConfiguration.ObjectLockEnabled ===
                'Enabled' && (
                <T.Row>
                  <T.Key> Default Object-lock Retention </T.Key>
                  <T.GroupValues>
                    <div>{getDefaultBucketRetention(bucketInfo)}</div>
                    <Button
                      id="edit-retention-btn"
                      variant="outline"
                      label="Edit"
                      icon={<Icon name="Pencil" />}
                      onClick={() =>
                        dispatch(
                          push(
                            `/accounts/${account?.Name}/buckets/${bucket.name}/retention-setting`,
                          ),
                        )
                      }
                    />
                  </T.GroupValues>
                </T.Row>
              )}
              {bucketInfo.objectLockConfiguration.ObjectLockEnabled ===
                'Disabled' && (
                <T.Row>
                  <T.Key>Object-lock</T.Key>
                  <T.Value>Disabled</T.Value>
                </T.Row>
              )}
              <T.Row>
                <T.Key> Location </T.Key>
                <T.Value>
                  {bucketInfo.locationConstraint || 'us-east-1'}
                  {' / '}
                  <small>
                    {locations &&
                      getLocationType(locations[bucketInfo.locationConstraint])}
                  </small>
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
