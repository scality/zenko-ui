// @noflow
import Table, * as T from '../../../ui-elements/TableKeyValue2';
import { Clipboard } from '../../../ui-elements/Clipboard';
import MiddleEllipsis from '../../../ui-elements/MiddleEllipsis';
import type { ObjectMetadata } from '../../../../types/s3';
import {
  FormattedDateTime,
  Icon,
  PrettyBytes,
  SecondaryText,
  spacing,
  Stack,
  Toggle,
} from '@scality/core-ui';
import { useEffect } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { putObjectLegalHold } from '../../../actions/s3object';
import { usePrefixWithSlash, useQueryParams } from '../../../utils/hooks';
import { AppState } from '../../../../types/state';
import { useHistory, useLocation } from 'react-router-dom';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { ColdStorageIconLabel } from '../../../ui-elements/ColdStorageIcon';
import ObjectRestorationButtonAndModal from './ObjectRestorationButtonAndModal';
import { useBucketDefaultRetention } from '../../../next-architecture/domain/business/buckets';
import { useAccountsLocationsEndpointsAdapter } from '../../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useAccountsLocationsAndEndpoints } from '../../../next-architecture/domain/business/accounts';
import {
  VEEAM_OBJECT_KEY,
  VEEAM_SYSTEM_KEY,
} from '../../../ui-elements/Veeam/VeeamConstants';

type Props = {
  objectMetadata: ObjectMetadata;
};
const TruncatedValue = styled.div`
  max-width: 18rem;
`;

function Properties({ objectMetadata }: Props) {
  const dispatch = useDispatch();
  const history = useHistory();
  const { pathname } = useLocation();
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { accountsLocationsAndEndpoints, status: checkColdLocationStatus } =
    useAccountsLocationsAndEndpoints({
      accountsLocationsEndpointsAdapter,
    });
  const isObjectInColdStorage =
    checkColdLocationStatus === 'success' &&
    accountsLocationsAndEndpoints?.locations.find(
      (location) => location.name === objectMetadata.storageClass,
    )?.isCold;

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
      history.push(`${pathname}?${query.toString()}`);
    }
  }, [objectMetadata.versionId]);
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
                  <TruncatedValue>
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
                  <FormattedDateTime
                    format="date-time-second"
                    value={new Date(objectMetadata.lastModified)}
                  />
                </T.Value>
              </T.Row>
              {objectMetadata.expiration ? (
                <T.Row>
                  <T.Key> Expires On </T.Key>
                  <T.Value>
                    <FormattedDateTime
                      format="date-time-second"
                      value={new Date(objectMetadata.expiration)}
                    />
                  </T.Value>
                </T.Row>
              ) : (
                ''
              )}
              <T.Row>
                <T.Key> ETag </T.Key>
                <T.GroupValues>
                  <div>{objectMetadata.eTag}</div>
                  <T.ExtraCell marginLeft={spacing.f8}>
                    <Clipboard text={objectMetadata.eTag} />
                  </T.ExtraCell>
                </T.GroupValues>
              </T.Row>
              <T.Row>
                <T.Key> Location </T.Key>
                <T.Value>
                  {objectMetadata.objectKey === VEEAM_SYSTEM_KEY ||
                  objectMetadata.objectKey === VEEAM_OBJECT_KEY
                    ? 'VIRTUAL'
                    : objectMetadata.storageClass || 'default'}
                </T.Value>
              </T.Row>
              {checkColdLocationStatus === 'idle' ||
                (checkColdLocationStatus === 'loading' && (
                  <T.Row>
                    <T.Key> Temperature </T.Key>
                    <T.Value>Loading location information...</T.Value>
                  </T.Row>
                ))}
              {(isObjectInColdStorage ||
                objectMetadata.restore?.expiryDate) && (
                <T.Row>
                  <T.Key> Temperature </T.Key>
                  <T.GroupValues>
                    <ColdStorageIconLabel />
                    {objectMetadata.restore?.ongoingRequest && (
                      <Stack>
                        <Icon name="Arrow-alt-circle-up" />
                        Restoration in progress...
                      </Stack>
                    )}
                    {objectMetadata.restore?.expiryDate && (
                      <Stack>
                        <Icon name="Expiration" />
                        Restored{' '}
                        <SecondaryText>
                          (Expiring{' '}
                          <FormattedDateTime
                            value={objectMetadata.restore?.expiryDate}
                            format="relative"
                          />
                          )
                        </SecondaryText>
                      </Stack>
                    )}
                    {!objectMetadata.restore?.ongoingRequest &&
                      !objectMetadata.restore?.expiryDate && (
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
                    {
                      //@ts-expect-error fix this when you are working on it
                      objectMetadata.lockStatus === 'LOCKED' && (
                        <>
                          Locked <Icon name="Lock" /> (
                          {objectMetadata.objectRetention.mode.toLowerCase()})
                          <br />
                          until {objectMetadata.objectRetention.retainUntilDate}
                        </>
                      )
                    }
                    {
                      //@ts-expect-error fix this when you are working on it
                      objectMetadata.lockStatus === 'RELEASED' && (
                        <>
                          Released <Icon name="Lock-open" />
                          <br />
                          since {objectMetadata.objectRetention.retainUntilDate}
                        </>
                      )
                    }
                    {
                      //@ts-expect-error fix this when you are working on it
                      objectMetadata.lockStatus === 'NONE' && 'No retention'
                    }
                  </div>
                  {isObjectLockEnabled && (
                    <Button
                      id="edit-object-retention-setting-btn"
                      variant="outline"
                      label="Edit"
                      icon={<Icon name="Pencil" />}
                      onClick={() =>
                        history.push(
                          `${pathname}/retention-setting?${query.toString()}`,
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
