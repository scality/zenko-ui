import * as L from '../../ui-elements/ListLayout2';
import React, { useMemo } from 'react';
import { useLocation } from 'react-router';
import { Redirect, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import BucketDetails from './BucketDetails';
import BucketList from './BucketList';
import { EmptyStateContainer } from '../../ui-elements/Container';
import Header from '../../ui-elements/EntityHeader';
import { Warning } from '../../ui-elements/Warning';
import { push } from 'connected-react-router';
import { MultiBucketsIcon } from './MutliBucketsIcon';
import { useCurrentAccount } from '../../DataServiceRoleProvider';
import { AppContainer, Icon, TwoPanelLayout } from '@scality/core-ui';

export default function Buckets() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const buckets = useSelector(
    (state: AppState) => state.s3.listBucketsResults.list,
  );

  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );
  const ingestionStates = useSelector(
    (state: AppState) =>
      state.instanceStatus.latest.metrics?.['ingest-schedule']?.states,
  );
  const { bucketName: bucketNameParam } = useParams();
  const { account } = useCurrentAccount();
  const bucketIndex = useMemo(
    () => buckets.findIndex((b) => b.Name === bucketNameParam),
    [buckets, bucketNameParam],
  );
  const bucket = bucketIndex >= 0 ? buckets.get(bucketIndex) : null;

  // empty state.
  if (buckets.size === 0) {
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          icon={<Icon name="Bucket" size="5x" />}
          title="Create your first bucket."
          btnTitle="Create Bucket"
          btnAction={() =>
            dispatch(push(`/accounts/${account?.Name}/create-bucket`))
          }
        />
      </EmptyStateContainer>
    );
  }

  // redirect to the first bucket.
  if (!bucketNameParam) {
    return <Redirect to={`${pathname}/${buckets.first().Name}`} />;
  }

  // replace the old <bucket-name> by the new one when we switch account
  if (
    bucketNameParam &&
    !buckets.filter((bucket) => bucket.Name === bucketNameParam).size
  ) {
    return (
      <Redirect
        to={`/accounts/${account.Name}/buckets/${buckets.first().Name}`}
      />
    );
  }

  return (
    <>
      <AppContainer.OverallSummary>
        <Header
          icon={<MultiBucketsIcon />}
          headTitle={'All Buckets'}
          numInstance={buckets ? buckets.size : 0}
        />
      </AppContainer.OverallSummary>
      <AppContainer.MainContent background="backgroundLevel1">
        <TwoPanelLayout
          panelsRatio="70-30"
          style={{ paddingTop: '2px' }}
          leftPanel={{
            children: (
              <BucketList
                selectedBucketName={bucketNameParam}
                buckets={buckets}
                locations={locations}
                ingestionStates={ingestionStates}
              />
            ),
          }}
          rightPanel={{
            children: (
              <BucketDetails
                bucket={bucket}
                ingestionStates={ingestionStates}
              />
            ),
          }}
        />
      </AppContainer.MainContent>
      {/* <L.Body></L.Body> */}
    </>
  );
}
