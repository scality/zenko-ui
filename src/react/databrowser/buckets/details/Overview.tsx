import React, { useEffect } from 'react';
import Table, * as T from '../../../ui-elements/TableKeyValue2';
import {
  closeBucketDeleteDialog,
  deleteBucket,
  getBucketInfo,
  openBucketDeleteDialog,
  toggleBucketVersioning,
} from '../../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../../types/state';
import { Button } from '@scality/core-ui/dist/next';
import { ButtonContainer } from '../../../ui-elements/Container';
import DeleteConfirmation from '../../../ui-elements/DeleteConfirmation';
import type { Replication } from '../../../../types/config';
import type { BucketInfo, S3Bucket } from '../../../../types/s3';
import { TableContainer } from '../../../ui-elements/Table';
import { Toggle } from '@scality/core-ui';
import {
  getLocationType,
  getLocationIngestionState,
} from '../../../utils/storageOptions';
import { maybePluralize } from '../../../utils';
import { SmallerText } from '@scality/core-ui/dist/components/text/Text.component';
import { useTheme } from 'styled-components';
import type { WorkflowScheduleUnitState } from '../../../../types/stats';
import { HelpAsyncNotification } from '../../../ui-elements/Help';
import { push } from 'connected-react-router';
import { XDM_FEATURE } from '../../../../js/config';
import { useWorkflows } from '../../../workflow/Workflows';
import { useCurrentAccount } from '../../../DataServiceRoleProvider';

function capitalize(string) {
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

function canDeleteBucket(
  bucketName: string,
  loading: boolean,
  replicationStreams: Array<Replication>,
) {
  if (loading) {
    return false;
  }

  const checkBucketStream = replicationStreams.find((r) => {
    return r.source.bucketName === bucketName;
  });

  if (checkBucketStream) {
    return false;
  }

  return true;
}

type Props = {
  bucket: S3Bucket;
  ingestionStates: WorkflowScheduleUnitState | null | undefined;
};

function Overview({ bucket, ingestionStates }: Props) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const showDelete = useSelector(
    (state: AppState) => state.uiBuckets.showDelete,
  );
  const bucketInfo = useSelector((state: AppState) => state.s3.bucketInfo);
  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );
  const workflowsQuery = useWorkflows();
  const features = useSelector((state: AppState) => state.auth.config.features);
  const { account } = useCurrentAccount();
  useEffect(() => {
    dispatch(getBucketInfo(bucket.Name));
  }, [dispatch, bucket.Name]);

  const handleDeleteClick = () => {
    if (!bucket) {
      return;
    }

    dispatch(openBucketDeleteDialog(bucket.Name));
  };

  const handleDeleteApprove = () => {
    if (!bucket) {
      return;
    }

    dispatch(deleteBucket(bucket.Name));
  };

  const handleDeleteCancel = () => {
    dispatch(closeBucketDeleteDialog());
  };

  if (!bucketInfo) {
    return null;
  }

  const { value: ingestionValue, isIngestion } = getLocationIngestionState(
    ingestionStates,
    bucketInfo.locationConstraint || 'us-east-1',
  );

  return (
    <TableContainer>
      <DeleteConfirmation
        show={showDelete === bucket.Name}
        cancel={handleDeleteCancel}
        approve={handleDeleteApprove}
        titleText={`Are you sure you want to delete bucket: ${bucket.Name} ?`}
      />
      <ButtonContainer>
        <Button
          icon={<i className="fas fa-trash" />}
          disabled={
            !canDeleteBucket(
              bucket.Name,
              loading,
              workflowsQuery.data?.replications || [],
            )
          }
          variant="danger"
          onClick={handleDeleteClick}
          label="Delete Bucket"
        />
      </ButtonContainer>
      <Table>
        <T.Body>
          <T.Group>
            <T.GroupName>General</T.GroupName>
            <T.GroupContent>
              <T.Row>
                <T.Key> Name </T.Key>
                <T.Value>{bucketInfo.name}</T.Value>
              </T.Row>
              <T.Row>
                <T.Key> Versioning </T.Key>
                <T.Value>
                  {bucketInfo.objectLockConfiguration.ObjectLockEnabled ===
                    'Disabled' && (
                    <Toggle
                      disabled={loading}
                      toggle={bucketInfo.isVersioning}
                      label={
                        bucketInfo.versioning === 'Enabled'
                          ? 'Active'
                          : bucketInfo.versioning === 'Disabled'
                          ? 'Inactive'
                          : bucketInfo.versioning
                      }
                      onChange={() =>
                        dispatch(
                          toggleBucketVersioning(
                            bucket.Name,
                            !bucketInfo.isVersioning,
                          ),
                        )
                      }
                    />
                  )}
                  {bucketInfo.objectLockConfiguration.ObjectLockEnabled ===
                    'Enabled' && (
                    <>
                      Enabled
                      <br />
                      <SmallerText
                        style={{
                          color: theme.brand.textSecondary,
                        }}
                      >
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
                      icon={<i className="fas fa-pencil-alt"></i>}
                      onClick={() =>
                        dispatch(
                          push(
                            `/accounts/${account?.Name}/buckets/${bucket.Name}/retention-setting`,
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
                    {getLocationType(locations[bucketInfo.locationConstraint])}
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
