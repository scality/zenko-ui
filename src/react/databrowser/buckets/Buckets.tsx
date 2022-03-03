import * as L from '../../ui-elements/ListLayout2';
import React, { useMemo } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import BucketDetails from './BucketDetails';
import BucketList from './BucketList';
import { EmptyStateContainer } from '../../ui-elements/Container';
import Header from '../../ui-elements/EntityHeader';
import { Warning } from '../../ui-elements/Warning';
import { push } from 'connected-react-router';
import MultiBucketsLogo from '../../../../public/assets/logo-multi-buckets.svg';
export default function Buckets() {
  const dispatch = useDispatch();
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
          iconClass="fas fa-5x fa-glass-whiskey"
          title="Create your first bucket."
          btnTitle="Create Bucket"
          btnAction={() => dispatch(push('/create-bucket'))}
        />
      </EmptyStateContainer>
    );
  }

  // redirect to the first bucket.
  if (!bucketNameParam) {
    return <Redirect to={`/buckets/${buckets.first().Name}`} />;
  }

  return (
    <L.ContentContainer>
      <Header
        icon={<img src={MultiBucketsLogo} alt="Multi Buckets Logo" />}
        headTitle={'All Buckets'}
        numInstance={buckets ? buckets.size : 0}
      />
      <L.Body>
        <BucketList
          selectedBucketName={bucketNameParam}
          buckets={buckets}
          locations={locations}
          ingestionStates={ingestionStates}
        />
        <BucketDetails bucket={bucket} ingestionStates={ingestionStates} />
      </L.Body>
    </L.ContentContainer>
  );
}