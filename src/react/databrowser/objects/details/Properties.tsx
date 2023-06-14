// @noflow
import Table, * as T from '../../../ui-elements/TableKeyValue2';
import { Clipboard } from '../../../ui-elements/Clipboard';
import MiddleEllipsis from '../../../ui-elements/MiddleEllipsis';
import type { ObjectMetadata } from '../../../../types/s3';
import {
  Icon,
  PrettyBytes,
  SecondaryText,
  spacing,
  Stack,
  Toggle,
} from '@scality/core-ui';
import { useEffect } from 'react';
import { formatShortDate } from '../../../utils';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { putObjectLegalHold } from '../../../actions/s3object';
import { usePrefixWithSlash, useQueryParams } from '../../../utils/hooks';
import { AppState } from '../../../../types/state';
import { push } from 'connected-react-router';
import { useLocation } from 'react-router';
import { Button } from '@scality/core-ui/dist/next';
import ColdStorageIcon from '../../../ui-elements/ColdStorageIcon';
import { DateTime } from 'luxon';
import ObjectRestorationButtonAndModal from './ObjectRestorationButtonAndModal';
import { useBucketDefaultRetention } from '../../../next-architecture/domain/business/buckets';

type Props = {
  objectMetadata: ObjectMetadata;
};
const TruncatedValue = styled.div`
  max-width: 18rem;
`;

function Properties({ objectMetadata }: Props) {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );
  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );
  const location =
    objectMetadata.storageClass && locations[objectMetadata.storageClass];
  const prefixWithSlash = usePrefixWithSlash();
  const isLegalHoldEnabled = objectMetadata.isLegalHoldEnabled;
  //Display Legal Hold when the Bucket is versioned and object-lock enabled.
  const { defaultRetention } = useBucketDefaultRetention({
    bucketName: objectMetadata.bucketName,
  });

  const isObjectLockEnabled =
    defaultRetention.status === 'success' &&
    defaultRetention.value.ObjectLockEnabled === 'Enabled';

  const query = useQueryParams();
  const metadataSearch = query.get('metadatasearch');
  // In order to keep object selection between toggling show versions, add `versionId` in the query params
  useEffect(() => {
    if (objectMetadata.versionId && objectMetadata.versionId !== 'null') {
      query.set('versionId', objectMetadata.versionId);
      dispatch(push(`${pathname}?${query.toString()}`));
    }
  }, [objectMetadata.versionId]);
  // Display the remaining days for the restored object from a cold location
  const restoreExpiryDays: number = objectMetadata.restore?.expiryDate
    ? Math.floor(
        DateTime.fromISO(objectMetadata.restore.expiryDate.toISOString())
          .diff(DateTime.now(), 'days')
          .toObject().days,
      )
    : -1;
  return (
    <div>
      <Table id="object-details-table">
        <T.Body>
          <T.Group>
            <T.GroupName> Information </T.GroupName>
            <T.GroupContent>
              <T.Row>
                <T.Key> Name </T.Key>
                <T.Value> {objectMetadata.objectKey} </T.Value>
              </T.Row>
              <T.Row hidden={!objectMetadata.versionId}>
                <T.Key> Version ID </T.Key>
                <T.GroupValues>
                  <TruncatedValue copiable>
                    <MiddleEllipsis
                      text={objectMetadata.versionId}
                      trailingCharCount={7}
                      tooltipWidth="16rem"
                    />
                  </TruncatedValue>
                  <T.ExtraCell marginLeft={spacing.f8}>
                    <Clipboard text={objectMetadata.versionId} />
                  </T.ExtraCell>
                </T.GroupValues>
              </T.Row>
              <T.Row>
                <T.Key> Size </T.Key>
                <T.Value>
                  <PrettyBytes
                    bytes={objectMetadata.contentLength}
                    decimals={2}
                  />
                </T.Value>
              </T.Row>
              <T.Row>
                <T.Key> Modified On </T.Key>
                <T.Value>
                  {formatShortDate(new Date(objectMetadata.lastModified))}{' '}
                </T.Value>
              </T.Row>
              {objectMetadata.expiration ? (
                <T.Row>
                  <T.Key> Expires On </T.Key>
                  <T.Value>
                    {formatShortDate(objectMetadata.expiration)}{' '}
                  </T.Value>
                </T.Row>
              ) : (
                ''
              )}
              <T.Row>
                <T.Key> ETag </T.Key>
                <T.GroupValues>
                  <div copiable>{objectMetadata.eTag}</div>
                  <T.ExtraCell marginLeft={spacing.f8}>
                    <Clipboard text={objectMetadata.eTag} />
                  </T.ExtraCell>
                </T.GroupValues>
              </T.Row>
              <T.Row>
                <T.Key> Location </T.Key>
                <T.Value>{objectMetadata.storageClass || 'default'}</T.Value>
              </T.Row>
              {location?.isCold && (
                <T.Row>
                  <T.Key> Temperature </T.Key>
                  <T.GroupValues>
                    <Stack>
                      <ColdStorageIcon /> Cold{' '}
                    </Stack>
                    {objectMetadata.restore?.ongoingRequest && (
                      <span>
                        <Icon name="Arrow-alt-circle-up" />
                        Restoration in progress...
                      </span>
                    )}
                    {objectMetadata.restore?.expiryDate && (
                      <span>
                        <Icon name="Expiration" />
                        Restored{' '}
                        <SecondaryText>
                          ({restoreExpiryDays}{' '}
                          {restoreExpiryDays > 1 ? 'days' : 'day'} remaining)
                        </SecondaryText>
                      </span>
                    )}
                    {!objectMetadata.restore?.ongoingRequest && (
                      <ObjectRestorationButtonAndModal
                        bucketName={objectMetadata.bucketName}
                        objectMetadata={objectMetadata}
                      />
                    )}
                  </T.GroupValues>
                </T.Row>
              )}
            </T.GroupContent>
          </T.Group>
          <T.Group>
            <T.GroupName> Data protection </T.GroupName>
            <T.GroupContent>
              <T.Row>
                <T.Key> Lock </T.Key>
                <T.GroupValues>
                  <div>
                    {objectMetadata.lockStatus === 'LOCKED' && (
                      <>
                        Locked <Icon name="Lock" />(
                        {objectMetadata.objectRetention.mode.toLowerCase()})
                        <br />
                        until {objectMetadata.objectRetention.retainUntilDate}
                      </>
                    )}
                    {objectMetadata.lockStatus === 'RELEASED' && (
                      <>
                        Released <Icon name="Lock-open" />
                        <br />
                        since {objectMetadata.objectRetention.retainUntilDate}
                      </>
                    )}
                    {objectMetadata.lockStatus === 'NONE' && 'No retention'}
                  </div>
                  {isObjectLockEnabled && (
                    <Button
                      id="edit-object-retention-setting-btn"
                      variant="outline"
                      label="Edit"
                      icon={<Icon name="Pencil" />}
                      onClick={() =>
                        dispatch(
                          push(
                            `${pathname}/retention-setting?${query.toString()}`,
                          ),
                        )
                      }
                    />
                  )}
                </T.GroupValues>
              </T.Row>
              {isObjectLockEnabled && (
                <T.Row>
                  <T.Key>Legal Hold</T.Key>
                  <T.Value>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Toggle
                        disabled={loading}
                        toggle={isLegalHoldEnabled}
                        label={isLegalHoldEnabled ? 'Active' : 'Inactive'}
                        onChange={() =>
                          dispatch(
                            putObjectLegalHold(
                              objectMetadata.bucketName,
                              objectMetadata.objectKey,
                              objectMetadata.versionId,
                              !isLegalHoldEnabled,
                              prefixWithSlash,
                              metadataSearch,
                            ),
                          )
                        }
                      />
                      {isLegalHoldEnabled && <Icon name="Rebalance" />}
                    </div>
                  </T.Value>
                </T.Row>
              )}
            </T.GroupContent>
          </T.Group>
        </T.Body>
      </Table>
    </div>
  );
}

export default Properties;
