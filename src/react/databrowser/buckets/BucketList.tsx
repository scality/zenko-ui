import {
  ConstrainedText,
  FormattedDateTime,
  Icon,
  Link,
  spacing,
} from '@scality/core-ui';
import { EmptyCell } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { Box, Button, Table } from '@scality/core-ui/dist/next';
import { useMemo } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { CoreUIColumn } from 'react-table';
import { XDM_FEATURE } from '../../../js/config';
import type { LocationName } from '../../../types/config';
import type { WorkflowScheduleUnitState } from '../../../types/stats';
import { useCurrentAccount } from '../../DataServiceRoleProvider';
import { useBucketLatestUsedCapacity } from '../../next-architecture/domain/business/buckets';
import { Bucket } from '../../next-architecture/domain/entities/bucket';
import { useConfig } from '../../next-architecture/ui/ConfigProvider';
import { useMetricsAdapter } from '../../next-architecture/ui/MetricsAdapterProvider';
import { getDataUsedColumn } from '../../next-architecture/ui/metrics/DataUsedColumn';
import { TableHeaderWrapper } from '../../ui-elements/Table';

import { useAuthGroups, useQueryParams } from '../../utils/hooks';
import { getLocationIngestionState } from '../../utils/storageOptions';
import { BucketLocationNameAndType } from '../../workflow/SourceBucketOption';

const SEARCH_QUERY_PARAM = 'search';

type Props = {
  buckets: Bucket[];
  selectedBucketName: string | null | undefined;
  ingestionStates: WorkflowScheduleUnitState | null | undefined;
};
export default function BucketList({
  selectedBucketName,
  buckets,
  ingestionStates,
}: Props) {
  const { accountName } = useParams<{ accountName: string }>();
  const { features } = useConfig();
  const query = useQueryParams();
  const { account } = useCurrentAccount();
  const history = useHistory();
  const tabName = query.get('tab');

  const { isStorageManager } = useAuthGroups();

  const columns = useMemo(() => {
    const dataUsedColumn = getDataUsedColumn((bucket: Bucket) => {
      const metricsAdapter = useMetricsAdapter();
      return useBucketLatestUsedCapacity({
        bucketName: bucket.name,
        metricsAdapter,
      });
    }, {});

    const columns: CoreUIColumn<Bucket>[] = [
      {
        Header: 'Bucket Name',
        accessor: 'name',

        Cell({ value: name }: { value: string }) {
          const history = useHistory();
          return (
            <ConstrainedText
              text={
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
              }
              lineClamp={2}
            />
          );
        },
        cellStyle: {
          flex: '1',
          width: 'unset',
        },
      },
      {
        Header: 'Storage Location',
        accessor: 'locationConstraint',

        Cell({ row }) {
          return BucketLocationNameAndType({ bucketName: row.original.name });
        },

        cellStyle: { width: 'unset', flex: '1.2' },
      },
    ];

    if (features.includes(XDM_FEATURE)) {
      columns.push({
        Header: 'Metadata updates',
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

    if (isStorageManager) {
      columns.push({
        ...dataUsedColumn,
        cellStyle: { textAlign: 'right', width: 'unset', flex: '0.8' },
      });
    }

    columns.push({
      Header: 'Created on',
      accessor: 'creationDate',
      cellStyle: {
        flex: '1',
        textAlign: 'right',
        paddingRight: spacing.r16,
        width: 'unset',
      },
      Cell({ value }: { value: string }) {
        return (
          <FormattedDateTime
            format="date-time-second"
            value={new Date(value)}
          />
        );
      },
    });
    return columns;
  }, [ingestionStates, features, isStorageManager]);

  const selectedId = useMemo(() => {
    if (buckets) {
      return buckets.findIndex((bucket) => bucket.name === selectedBucketName);
    }
    return null;
  }, [selectedBucketName, buckets]);
  return (
    <Box display="flex" flexDirection="column" id="bucket-list" width="100%">
      <Table
        columns={columns}
        data={buckets}
        defaultSortingKey="creationDate"
        entityName={{
          en: {
            singular: 'bucket',
            plural: 'buckets',
          },
        }}
      >
        <TableHeaderWrapper
          search={
            <Table.SearchWithQueryParams queryParams={SEARCH_QUERY_PARAM} />
          }
          actions={
            <Button
              icon={<Icon name="Create-add" />}
              label="Create Bucket"
              variant="primary"
              onClick={() =>
                history.push(`/accounts/${accountName}/create-bucket`)
              }
              type="submit"
            />
          }
        />

        <Table.SingleSelectableContent
          rowHeight="h40"
          selectedId={selectedId?.toString()}
          onRowSelected={(row) => {
            const isSelected = selectedBucketName === row.original.name;

            if (!isSelected) {
              history.push(
                tabName
                  ? `/accounts/${account?.Name}/buckets/${row.original.name}?tab=${tabName}`
                  : `/accounts/${account?.Name}/buckets/${row.original.name}`,
              );
            }
          }}
          separationLineVariant="backgroundLevel1"
        />
      </Table>
    </Box>
  );
}
