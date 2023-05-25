import type { LocationName, Locations } from '../../../types/config';
import { useMemo } from 'react';
import * as T from '../../ui-elements/Table';
import { TextAligner } from '../../ui-elements/Utility';
import { formatShortDate } from '../../utils';
import { getLocationIngestionState } from '../../utils/storageOptions';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';
import type { WorkflowScheduleUnitState } from '../../../types/stats';
import { XDM_FEATURE } from '../../../js/config';
import { useHistory, useParams } from 'react-router';
import { Icon, Link, spacing } from '@scality/core-ui';
import { Box, Table } from '@scality/core-ui/dist/next';
import { useQueryParams } from '../../utils/hooks';
import { useCurrentAccount } from '../../DataServiceRoleProvider';
import { Bucket } from '../../next-architecture/domain/entities/bucket';
import { CoreUIColumn } from 'react-table';
import { useBucketLatestUsedCapacity } from '../../next-architecture/domain/business/buckets';
import { useMetricsAdapter } from '../../next-architecture/ui/MetricsAdapterProvider';
import { UsedCapacityInlinePromiseResult } from '../../next-architecture/ui/metrics/LatestUsedCapacity';
import { useConfig } from '../../next-architecture/ui/ConfigProvider';
import { BucketLocationNameAndType } from '../../workflow/SourceBucketOption';
import { EmptyCell } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';

const SEARCH_QUERY_PARAM = 'search';

type Props = {
  locations: Locations;
  buckets: Bucket[];
  selectedBucketName: string | null | undefined;
  ingestionStates: WorkflowScheduleUnitState | null | undefined;
};
export default function BucketList({
  selectedBucketName,
  buckets,
  locations,
  ingestionStates,
}: Props) {
  const { accountName } = useParams<{ accountName: string }>();
  const dispatch = useDispatch();
  const { features } = useConfig();
  const query = useQueryParams();
  const { account } = useCurrentAccount();
  const tabName = query.get('tab');

  const columns = useMemo(() => {
    const columns: CoreUIColumn<Bucket>[] = [
      {
        Header: 'Bucket Name',
        accessor: 'name',

        Cell({ value: name }: { value: string }) {
          const history = useHistory();
          return (
            <Link
              href="#"
              onClick={(e) => {
                e.stopPropagation();
                history.push(
                  `/accounts/${accountName}/buckets/${name}/objects`,
                );
              }}
            >
              {name}
            </Link>
          );
        },
        cellStyle: {
          flex: '1',
          paddingLeft: '1rem',
        },
      },
      {
        Header: 'Storage Location',
        accessor: 'locationConstraint',

        Cell({ row }) {
          return BucketLocationNameAndType({ bucketName: row.original.name });
        },
        cellStyle: {
          flex: '1',
        },
      },
    ];

    if (features.includes(XDM_FEATURE)) {
      columns.push({
        Header: 'Async Metadata updates',
        accessor: 'locationConstraint',
        id: 'ingestion',
        disableSortBy: true,
        cellStyle: {
          flex: '1',
          textAlign: 'right',
        },
        Cell({ value: locationName }: { value: LocationName }) {
          const value = getLocationIngestionState(
            ingestionStates,
            locationName,
          ).value;
          if (value === '-') {
            return <EmptyCell mr={0} />;
          }
          return value;
        },
      });
    }

    columns.push({
      Header: 'Data Used',
      accessor: 'usedCapacity',
      cellStyle: {
        textAlign: 'right',
      },

      Cell({ row }) {
        const metricsAdapter = useMetricsAdapter();
        const bucketName = row.original.name;
        const { usedCapacity } = useBucketLatestUsedCapacity({
          bucketName,
          metricsAdapter,
        });

        return <UsedCapacityInlinePromiseResult result={usedCapacity} />;
      },
    });

    columns.push({
      Header: 'Created on',
      accessor: 'creationDate',
      cellStyle: {
        flex: '1',
        paddingRight: spacing.r32,
        textAlign: 'right',
      },

      Cell({ value }: { value: string }) {
        return (
          <TextAligner alignment="right">
            {formatShortDate(new Date(value))}
          </TextAligner>
        );
      },
    });
    return columns;
  }, [locations, ingestionStates, features]);

  const selectedId = useMemo(() => {
    if (buckets) {
      return buckets.findIndex((bucket) => bucket.name === selectedBucketName);
    }
    return null;
  }, [selectedBucketName, buckets]);

  return (
    <Box display="flex" flexDirection="column" flex="1" id="bucket-list">
      <T.Container>
        <Table
          columns={columns}
          data={buckets}
          defaultSortingKey="creationDate"
        >
          <T.SearchContainer>
            <T.Search>
              <Table.SearchWithQueryParams
                displayedName={{
                  singular: 'bucket',
                  plural: 'buckets',
                }}
                queryParams={SEARCH_QUERY_PARAM}
              />
            </T.Search>
            <T.ExtraButton
              icon={<Icon name="Create-add" />}
              label="Create Bucket"
              variant="primary"
              onClick={() =>
                dispatch(push(`/accounts/${accountName}/create-bucket`))
              }
              type="submit"
            />
          </T.SearchContainer>
          <Table.SingleSelectableContent
            rowHeight="h40"
            selectedId={selectedId?.toString()}
            onRowSelected={(row) => {
              const isSelected = selectedBucketName === row.original.name;

              if (!isSelected) {
                dispatch(
                  push(
                    tabName
                      ? `/accounts/${account?.Name}/buckets/${row.original.name}?tab=${tabName}`
                      : `/accounts/${account?.Name}/buckets/${row.original.name}`,
                  ),
                );
              }
            }}
            separationLineVariant="backgroundLevel1"
            backgroundVariant="backgroundLevel3"
          />
        </Table>
      </T.Container>
    </Box>
  );
}
