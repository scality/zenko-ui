import React, { useEffect, useState } from 'react';
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
import type { BucketInfo, S3Bucket } from '../../../../types/s3';
import { CellLink, TableContainer } from '../../../ui-elements/Table';
import { Icon, Toggle } from '@scality/core-ui';
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
import { DumbErrorModal } from '../../../ui-elements/ErrorHandlerModal';
import { Bucket } from '../../../next-architecture/domain/entities/bucket';

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

function canDeleteBucket(loading: boolean) {
  if (loading) {
    return false;
  }

  return true;
}

type Props = {
  bucket: Bucket;
  ingestionStates: WorkflowScheduleUnitState | null | undefined;
};

const workflowAttachedError = (count: number) => (
  <div>
    The bucket you tried to delete has{' '}
    {maybePluralize(count, 'workflow', 's', true)} attached to it, you should{' '}
    <CellLink
      to={{
        pathname: '/workflows',
      }}
    >
      delete
    </CellLink>{' '}
    {count > 1 ? 'them' : 'it'} first.
  </div>
);

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
  const workflowsQuery = useWorkflows([bucket.name]);
  const features = useSelector((state: AppState) => state.auth.config.features);
  const { account } = useCurrentAccount();
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  useEffect(() => {
    dispatch(getBucketInfo(bucket.name));
  }, [dispatch, bucket.name]);

  const workflows = workflowsQuery.data;
  const attachedWorkflowsCount =
    (workflows?.expirations?.length || 0) +
    (workflows?.replications.length || 0) +
    (workflows?.transitions.length || 0);

  const handleDeleteClick = () => {
    if (!bucket) {
      return;
    }

    if (attachedWorkflowsCount > 0) {
      setIsErrorModalOpen(true);
      return;
    }

    dispatch(openBucketDeleteDialog(bucket.name));
  };

  const handleDeleteApprove = () => {
    if (!bucket) {
      return;
    }

    dispatch(deleteBucket(bucket.name));
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
        show={showDelete === bucket.name}
        cancel={handleDeleteCancel}
        approve={handleDeleteApprove}
        titleText={`Are you sure you want to delete bucket: ${bucket.name} ?`}
      />
      <DumbErrorModal
        isOpen={isErrorModalOpen}
        close={() => {
          setIsErrorModalOpen(false);
        }}
        errorMessage={
          isErrorModalOpen
            ? workflowAttachedError(attachedWorkflowsCount)
            : null
        }
      />
      <ButtonContainer>
        <Button
          icon={<Icon name="Delete" />}
          disabled={!canDeleteBucket(loading)}
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
                            bucket.name,
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
