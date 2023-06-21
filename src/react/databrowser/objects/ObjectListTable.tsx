import MemoRow, { createItemData } from './ObjectRow';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Table, * as T from '../../ui-elements/Table';
import {
  continueListObjects,
  continueSearchObjects,
  toggleAllObjects,
  toggleObject,
} from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import { useFilters, useFlexLayout, useSortBy, useTable } from 'react-table';
import type { AppState } from '../../../types/state';
import { AutoSizer } from 'react-virtualized';
import { Checkbox } from '../../ui-elements/FormLayout';
import { ColdStorageIcon } from '../../ui-elements/ColdStorageIcon';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { List } from 'immutable';
import MiddleEllipsis from '../../ui-elements/MiddleEllipsis';
import type { ObjectEntity } from '../../../types/s3';
import { PrettyBytes, Text } from '@scality/core-ui';
import { TextAligner } from '../../ui-elements/Utility';
import { convertRemToPixels } from '@scality/core-ui/dist/utils';
import { push } from 'connected-react-router';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
import { useQueryParams } from '../../utils/hooks';
import { useParams } from 'react-router';
import { CenterredSecondaryText } from '../../account/iamAttachment/AttachmentTable';
import { useQuery } from 'react-query';
import { useS3Client } from '../../next-architecture/ui/S3ClientProvider';
import { parseRestore } from '../../reducers/s3';
export const Icon = styled.i`
  margin-right: ${spacing.sp4};
  margin-left: ${(props) => (props.isMargin ? spacing.sp16 : '0px')};
`;
type CellProps = {
  row: {
    original: ObjectEntity;
  };
};
type Props = {
  objects: List<ObjectEntity>;
  bucketName: string;
  toggled: List<ObjectEntity>;
  isVersioningType: boolean;
  prefixWithSlash: string;
};
export default function ObjectListTable({
  objects,
  bucketName,
  toggled,
  isVersioningType,
  prefixWithSlash,
}: Props) {
  const { accountName } = useParams<{ accountName: string }>();

  const [isTableScrollbarVisible, setIsTableScrollbarVisible] = useState(false);
  const [tableWidth, setTableWidth] = useState(0);
  const dispatch = useDispatch();
  const nextMarker = useSelector(
    (state: AppState) => state.s3.listObjectsResults.nextMarker,
  );
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );
  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );
  const objectsLength = objects.size;
  const isToggledFull = toggled.size > 0 && toggled.size === objectsLength;
  const isItemLoaded = useCallback(
    (index) => {
      const shouldRefetch =
        !loading && nextMarker && index === objectsLength - 1;
      return !shouldRefetch;
    },
    [nextMarker, objectsLength, loading],
  );
  const handleCellClicked = useCallback(
    (bucketName, key) => (e) => {
      e.stopPropagation();
      query.set('prefix', key);
      dispatch(
        push(
          `/accounts/${accountName}/buckets/${bucketName}/objects?${query.toString()}`,
        ),
      );
    },
    [dispatch],
  );
  const query = useQueryParams();
  const objectKey = query.get('prefix');
  const versionId = query.get('versionId');
  const isListVersion = query.get('showversions') === 'true';
  const isFolder = query.get('isFolder') === 'true';
  const searchInput = query.get('metadatasearch');
  const versionIdOrUndefined =
    isListVersion && versionId ? versionId : undefined;
  useEffect(() => {
    if (objectsLength > 0) {
      dispatch(
        toggleObject(
          isFolder ? `${objectKey}/` : objectKey,
          versionIdOrUndefined,
        ),
      );
    }
  }, [
    dispatch,
    isListVersion,
    objectsLength,
    objectKey,
    isFolder,
    versionIdOrUndefined,
  ]);
  // TODO:
  //      Current row selection should be seperated from multiple selections.
  //      The issue we have right now is once we trigger the listObject action, we lose the current selection. Because we use `toggled` flag to store the selection.
  //      It should be solved by updating with the new table component.
  const columns = useMemo(
    () => [
      {
        id: 'checkbox',
        accessor: '',
        headerStyle: {
          display: 'flex',
        },

        Cell({ row: { original } }: CellProps) {
          return (
            <div
              style={{
                textOverflow: 'clip',
              }}
            >
              <Checkbox
                name="objectCheckbox"
                checked={original.toggled}
                onClick={(e) => e.stopPropagation()} // Prevent checkbox and clickable table row conflict.
                onChange={() =>
                  dispatch(toggleObject(original.key, original.versionId))
                }
              />
            </div>
          );
        },

        Header: (
          <Checkbox
            name="objectsHeaderCheckbox"
            checked={isToggledFull}
            onChange={() => dispatch(toggleAllObjects(!isToggledFull))}
          />
        ),
        disableSortBy: true,
        width: 1,
      },
      {
        Header: 'Name',
        accessor: 'name',
        Cell({ row: { original } }: CellProps) {
          const s3Client = useS3Client();
          const { data: headObject, status: headObjectStatus } = useQuery({
            queryKey: [
              'headObject',
              bucketName,
              original.key,
              original.versionId,
            ],
            queryFn: () =>
              s3Client
                .headObject({
                  Bucket: bucketName,
                  Key: original.key,
                  VersionId: original.versionId,
                })
                .promise(),
          });

          const restore = parseRestore(headObject?.Restore);

          const storageClass = original.storageClass;
          const isObjectInColdStorage = !!locations[storageClass]?.isCold;
          if (original.isFolder) {
            return (
              <span>
                <Icon className="far fa-folder"></Icon>
                <T.CellClick
                  onClick={handleCellClicked(bucketName, original.key)}
                >
                  {original.name}
                </T.CellClick>
              </span>
            );
          }

          if (original.isDeleteMarker) {
            return (
              <span>
                {' '}
                <Icon
                  isMargin={!original.isLatest}
                  className="fas fa-ban"
                ></Icon>
                {original.name}
              </span>
            );
          }

          return (
            <span>
              <Icon
                isMargin={!original.isLatest}
                className="far fa-file"
              ></Icon>
              {original.lockStatus === 'LOCKED' && (
                <Icon className="fa fa-lock"></Icon>
              )}
              {original.lockStatus === 'RELEASED' && (
                <Icon className="fa fa-lock-open"></Icon>
              )}
              {original.isLegalHoldEnabled && (
                <Icon className="fas fa-balance-scale"></Icon>
              )}
              {isObjectInColdStorage &&
              (headObjectStatus === 'idle' ||
                headObjectStatus === 'loading' ||
                headObjectStatus === 'error' ||
                !restore.expiryDate) ? (
                <Text>{original.name}</Text>
              ) : (
                <T.CellA
                  href={original.signedUrl}
                  download={`${bucketName}-${original.key}`}
                >
                  {original.name}
                </T.CellA>
              )}
            </span>
          );
        },

        width: isVersioningType ? 44 : 59,
      },
      {
        Header: 'Version ID',
        accessor: 'versionId',
        cellStyle: {
          overflow: 'visible',
        },

        Cell({ value: versionId }: { value: string }) {
          return <MiddleEllipsis width={tableWidth} text={versionId} />;
        },

        width: 20,
      },
      {
        Header: 'Modified on',
        accessor: 'lastModified',
        headerStyle: {
          textAlign: 'right',
        },
        cellStyle: {
          textAlign: 'right',
        },
        width: 25,
      },
      {
        id: 'size',
        Header: 'Size',
        headerStyle: {
          textAlign: 'right',
          marginRight: spacing.sp16,
        },
        cellStyle: {
          marginRight: isTableScrollbarVisible ? spacing.sp8 : spacing.sp16,
        },
        accessor: (row) => (row.size ? row.size : ''),
        Cell({ value: size }: { value: string }) {
          return (
            <TextAligner alignment={'right'}>
              <PrettyBytes bytes={size} />
            </TextAligner>
          );
        },
        width: 10,
      },
      {
        Header: 'Storage Location',
        accessor: 'storageClass',
        width: 20,
        Cell({ value: storageClass }: { value: string }) {
          return (
            <div>
              {locations.storageClass?.isCold ? <ColdStorageIcon /> : ''}{' '}
              {storageClass === 'STANDARD' ? 'default' : storageClass}
            </div>
          );
        },
      },
    ],
    [
      bucketName,
      dispatch,
      handleCellClicked,
      isTableScrollbarVisible,
      isToggledFull,
      isVersioningType,
      tableWidth,
    ],
  );
  const hiddenColumns = isVersioningType ? [] : ['versionId'];
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable(
      {
        columns,
        data: objects,
        disableSortRemove: true,
        autoResetFilters: false,
        autoResetSortBy: false,
        initialState: {
          hiddenColumns,
        },
      },
      useFilters,
      useSortBy,
      useFlexLayout,
    );
  // NOTE: Calculates the size of the scrollbar to apply margin
  // on the "Size" column so that it can be aligned to the right even if the scrollbar is displayed
  const refList = useCallback((ref) => {
    if (ref) {
      setTableWidth(parseInt(ref.props.width));

      if (ref._outerRef) {
        const { scrollHeight, clientHeight } = ref._outerRef;
        setIsTableScrollbarVisible(scrollHeight > clientHeight);
      }
    }
  }, []);
  return (
    <T.ContainerWithSubHeader>
      <Table {...getTableProps()}>
        <T.Head>
          {headerGroups.map((headerGroup) => (
            <T.HeadRow
              key={headerGroup.id}
              {...headerGroup.getHeaderGroupProps()}
            >
              {headerGroup.headers.map((column) => {
                const headerProps = column.getHeaderProps();
                return (
                  <T.HeadCell
                    id={`object-list-table-head-${column.id}`}
                    key={column.id}
                    {...headerProps}
                    style={{
                      ...column.headerStyle,
                      ...headerProps.style,
                      cursor: 'default',
                    }}
                  >
                    {column.render('Header')}
                  </T.HeadCell>
                );
              })}
            </T.HeadRow>
          ))}
        </T.Head>
        <T.BodyWindowing {...getTableBodyProps()}>
          <AutoSizer>
            {(
              { height, width }, // ISSUE: https://github.com/bvaughn/react-window/issues/504
            ) => (
              <InfiniteLoader
                isItemLoaded={isItemLoaded}
                itemCount={rows.length}
                loadMoreItems={() => {
                  if (!searchInput) {
                    return dispatch(
                      continueListObjects(bucketName, prefixWithSlash),
                    );
                  } else {
                    return dispatch(
                      continueSearchObjects(bucketName, searchInput),
                    );
                  }
                }}
              >
                {({ onItemsRendered, ref }) =>
                  rows.length > 0 ? (
                    <FixedSizeList
                      height={height || 300}
                      itemCount={rows.length}
                      itemSize={
                        convertRemToPixels(parseFloat(spacing.sp40)) || 45
                      }
                      width={width || '100%'}
                      itemData={createItemData(rows, prepareRow, dispatch)}
                      onItemsRendered={onItemsRendered}
                      ref={(list) => {
                        refList(list);
                        ref(list);
                      }}
                    >
                      {MemoRow}
                    </FixedSizeList>
                  ) : (
                    <div style={{ width: width || '100%' }}>
                      <CenterredSecondaryText>
                        No Objects
                      </CenterredSecondaryText>
                    </div>
                  )
                }
              </InfiniteLoader>
            )}
          </AutoSizer>
        </T.BodyWindowing>
      </Table>
    </T.ContainerWithSubHeader>
  );
}
