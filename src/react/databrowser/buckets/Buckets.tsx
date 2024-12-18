import {
  AppContainer,
  EmptyState,
  Icon,
  Loader,
  TwoPanelLayout,
} from '@scality/core-ui';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation, useParams } from 'react-router';
import { AppState } from '../../../types/state';
import { useCurrentAccount } from '../../DataServiceRoleProvider';
import { useListBucketsForCurrentAccount } from '../../next-architecture/domain/business/buckets';
import { useConfig } from '../../next-architecture/ui/ConfigProvider';
import { useMetricsAdapter } from '../../next-architecture/ui/MetricsAdapterProvider';
import { EmptyStateContainer } from '../../ui-elements/Container';
import Header from '../../ui-elements/EntityHeader';
import { Warning } from '../../ui-elements/Warning';
import BucketDetails from './BucketDetails';
import BucketList from './BucketList';
import { MultiBucketsIcon } from './MutliBucketsIcon';

export default function Buckets() {
  const metricsAdapter = useMetricsAdapter();
  const { buckets } = useListBucketsForCurrentAccount({ metricsAdapter });

  const ingestionStates = useSelector(
    (state: AppState) =>
      state.instanceStatus.latest.metrics?.['ingest-schedule']?.states,
  );
  const { bucketName: bucketNameParam, accountName } = useParams<{
    bucketName: string;
    accountName: string;
  }>();
  const { account } = useCurrentAccount();
  const bucketIndex = useMemo(
    () =>
      buckets.status === 'success'
        ? buckets.value.findIndex((b) => b.name === bucketNameParam)
        : -1,
    [buckets.status, bucketNameParam],
  );

  const { basePath } = useConfig();
  const { pathname } = useLocation();

  if (buckets.status === 'error') {
    return (
      <EmptyStateContainer>
        <Warning
          title="Error"
          icon={<Icon name="Times-circle" size="5x" />}
          centered
        />
      </EmptyStateContainer>
    );
  }

  if (buckets.status === 'loading' || buckets.status === 'unknown') {
    return (
      <EmptyStateContainer>
        <Loader size="massive" centered />
      </EmptyStateContainer>
    );
  }

  const bucket = bucketIndex >= 0 ? buckets.value[bucketIndex] : null;

  if (buckets.value.length === 0) {
    return (
      <EmptyState
        icon="Bucket"
        link={`${basePath}/accounts/${account?.Name}/create-bucket`}
        listedResource={{
          singular: 'Bucket',
          plural: 'Buckets',
        }}
      ></EmptyState>
    );
  }

  // Redirect to the first bucket if no bucket name is provided
  if (!bucketNameParam) {
    return (
      <Navigate
        to={`${basePath}/accounts/${account?.Name}/buckets/${buckets.value[0].name}`}
        replace
      />
    );
  }

  // Replace the old bucket name with the new one when switching accounts

  if (
    bucketNameParam &&
    !buckets.value.some((bucket) => bucket.name === bucketNameParam) &&
    accountName === account?.Name
  ) {
    return (
      <Navigate
        to={`${basePath}/accounts/${account?.Name}/buckets/${buckets.value[0].name}`}
        replace
      />
    );
  }

  return (
    <>
      <AppContainer.OverallSummary>
        <Header
          icon={<MultiBucketsIcon />}
          headTitle={'All Buckets'}
          numInstance={buckets.value.length}
        />
      </AppContainer.OverallSummary>
      <AppContainer.MainContent background="backgroundLevel1">
        <TwoPanelLayout
          panelsRatio="65-35"
          leftPanel={{
            children: (
              <BucketList
                selectedBucketName={bucketNameParam}
                buckets={buckets.value}
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
    </>
  );
}
