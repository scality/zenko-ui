import { useMemo } from 'react';
import { useLocation, Redirect, useParams, useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import BucketDetails from './BucketDetails';
import BucketList from './BucketList';
import { EmptyStateContainer } from '../../ui-elements/Container';
import Header from '../../ui-elements/EntityHeader';
import { Warning } from '../../ui-elements/Warning';
import { MultiBucketsIcon } from './MutliBucketsIcon';
import { useCurrentAccount } from '../../DataServiceRoleProvider';
import { AppContainer, Icon, Loader, TwoPanelLayout } from '@scality/core-ui';
import { useListBucketsForCurrentAccount } from '../../next-architecture/domain/business/buckets';
import { useMetricsAdapter } from '../../next-architecture/ui/MetricsAdapterProvider';

export default function Buckets() {
  const history = useHistory();
  const { pathname } = useLocation();
  const metricsAdapter = useMetricsAdapter();
  const { buckets } = useListBucketsForCurrentAccount({ metricsAdapter });

  const ingestionStates = useSelector(
    (state: AppState) =>
      state.instanceStatus.latest.metrics?.['ingest-schedule']?.states,
  );
  const { bucketName: bucketNameParam } = useParams<{ bucketName: string }>();
  const { account } = useCurrentAccount();
  const bucketIndex = useMemo(
    () =>
      buckets.status === 'success'
        ? buckets.value.findIndex((b) => b.name === bucketNameParam)
        : -1,
    [buckets.status, bucketNameParam],
  );

  if (buckets.status === 'error') {
    return (
      <EmptyStateContainer>
        <Warning title="Error" icon={<Icon name="Times-circle" size="5x" />} />
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

  // empty state.
  if (buckets.value.length === 0) {
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          icon={<Icon name="Bucket" size="5x" />}
          title="Create your first bucket."
          btnTitle="Create Bucket"
          btnAction={() =>
            history.push(`/accounts/${account?.Name}/create-bucket`)
          }
        />
      </EmptyStateContainer>
    );
  }

  // redirect to the first bucket.
  if (!bucketNameParam) {
    return <Redirect to={`${pathname}/${buckets.value[0].name}`} />;
  }

  // replace the old <bucket-name> by the new one when we switch account
  if (
    bucketNameParam &&
    !buckets.value.filter((bucket) => bucket.name === bucketNameParam).length
  ) {
    return (
      <Redirect
        to={`/accounts/${account?.Name}/buckets/${buckets.value[0].name}`}
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
    </>
  );
}
