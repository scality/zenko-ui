import type { LocationName, Locations } from '../../../types/config';
import React, { useMemo, useState } from 'react';
import * as T from '../../ui-elements/Table';
import type { S3Bucket, S3BucketList } from '../../../types/s3';
import { TextAligner } from '../../ui-elements/Utility';
import { formatShortDate } from '../../utils';
import {
  getLocationType,
  getLocationIngestionState,
} from '../../utils/storageOptions';
import { push } from 'connected-react-router';
import { useDispatch, useSelector } from 'react-redux';
import type { WorkflowScheduleUnitState } from '../../../types/stats';
import type { AppState } from '../../../types/state';
import { XDM_FEATURE } from '../../../js/config';
import { useParams } from 'react-router';
import { Icon, spacing } from '@scality/core-ui';
import { Box, Table } from '@scality/core-ui/dist/next';
import { useQueryParams } from '../../utils/hooks';
import { useCurrentAccount } from '../../DataServiceRoleProvider';

type Props = {
  locations: Locations;
  buckets: S3BucketList;
  selectedBucketName: string | null | undefined;
  ingestionStates: WorkflowScheduleUnitState | null | undefined;
};
export default function BucketList({
  selectedBucketName,
  buckets: bucketsImmutableList,
  locations,
  ingestionStates,
}: Props) {
  const { accountName } = useParams<{ accountName: string }>();
  const dispatch = useDispatch();
  const features = useSelector((state: AppState) => state.auth.config.features);
  const query = useQueryParams();
  const { account } = useCurrentAccount();
  const tabName = query.get('tab');
  const [bucketNameFilter, setBucketNameFilter] = useState<string>('');

  const columns = useMemo(() => {
    const columns = [
      {
        Header: 'Bucket Name',
        accessor: 'Name',

        Cell({ value: name }: { value: string }) {
          return (
            <T.CellLink
              onClick={(event) => event.stopPropagation()}
              to={`/accounts/${accountName}/buckets/${name}/objects`}
            >
              {name}
            </T.CellLink>
          );
        },
        cellStyle: {
          flex: '1',
          paddingLeft: '1rem',
        },
      },
      {
        Header: 'Storage Location',
        accessor: 'LocationConstraint',

        Cell({ value: locationName }: { value: LocationName }) {
          const locationType = getLocationType(locations[locationName]);
          return `${locationName || 'us-east-1'} / ${locationType}`;
        },
        cellStyle: {
          flex: '1',
        },
      },
    ];

    if (features.includes(XDM_FEATURE)) {
      columns.push({
        Header: 'Async Metadata updates',
        accessor: 'LocationConstraint',
        id: 'ingestion',
        disableSortBy: true,

        Cell({ value: locationName }: { value: LocationName }) {
          return getLocationIngestionState(ingestionStates, locationName).value;
        },
        cellStyle: {
          flex: '1',
        },
      });
    }

    columns.push({
      Header: 'Created on',
      accessor: 'CreationDate',
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

  const buckets = useMemo(
    () => bucketsImmutableList.toJS(),
    [bucketsImmutableList.size],
  ) as S3Bucket[];
  const selectedId = useMemo(() => {
    if (buckets) {
      return buckets.findIndex((bucket) => bucket.Name === selectedBucketName);
    }
    return null;
  }, [selectedBucketName, buckets]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      flex="1"
      id="bucket-list"
      paddingTop={spacing.r16}
    >
      <T.SearchContainer>
        <T.Search>
          {' '}
          <T.SearchInput
            disableToggle={true}
            placeholder="Search by Bucket Name"
            onChange={(e) => setBucketNameFilter(e.target.value)}
          />{' '}
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
      <T.Container>
        <Table
          columns={columns}
          data={buckets}
          defaultSortingKey="CreationDate"
          allFilters={[{ id: 'Name', value: bucketNameFilter }]}
        >
          <Table.SingleSelectableContent
            rowHeight="h40"
            selectedId={selectedId?.toString()}
            onRowSelected={(row) => {
              const isSelected = selectedBucketName === row.original.Name;

              if (!isSelected) {
                dispatch(
                  push(
                    tabName
                      ? `/accounts/${account?.Name}/buckets/${row.original.Name}?tab=${tabName}`
                      : `/accounts/${account?.Name}/buckets/${row.original.Name}`,
                  ),
                );
              }
            }}
            separationLineVariant="backgroundLevel3"
            backgroundVariant="backgroundLevel1"
          />
        </Table>
      </T.Container>
    </Box>
  );
}
