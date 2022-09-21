import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as T from '../../ui-elements/Table';
import {
  continueListObjects,
  continueSearchObjects,
  getObjectMetadata,
  resetObjectMetadata,
  toggleAllObjects,
  toggleObject,
} from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import ColdStorageIcon from '../../ui-elements/ColdStorageIcon';
import { List } from 'immutable';
import MiddleEllipsis from '../../ui-elements/MiddleEllipsis';
import type { ObjectEntity } from '../../../types/s3';
import { PrettyBytes } from '@scality/core-ui';
import { TextAligner } from '../../ui-elements/Utility';
import { push } from 'connected-react-router';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
import { useQueryParams } from '../../utils/hooks';
import { useLocation, useParams } from 'react-router';
import { Table } from '@scality/core-ui/dist/next';
import { isVersioningDisabled } from '../../utils';
import { removeTrailingSlash } from '../../../js/utils';
import { Row } from 'react-table';

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

const getUniqueObjectID = (
  key: string,
  versionId: string | undefined,
  isVersioningType: boolean,
) => (isVersioningType ? (versionId as string) : key);

const getObject = (
  objects: List<ObjectEntity>,
  key: string,
  versionId: string | undefined,
  isVersioningType: boolean,
) => {
  const [selectedObject] = objects.filter(
    (object) =>
      getUniqueObjectID(key, versionId, isVersioningType) ===
      getUniqueObjectID(object.key, object.versionId, isVersioningType),
  );
  return selectedObject;
};

const mutateQuery = (
  query: URLSearchParams,
  key: string,
  versionId: string | undefined,
) => {
  query.set('prefix', removeTrailingSlash(key));

  if (key.slice(-1) === '/') {
    query.set('isFolder', 'true');
  } else {
    query.delete('isFolder');
  }

  if (versionId) {
    query.set('versionId', versionId);
  } else {
    query.delete('versionId');
  }
};

export default function ObjectListTable({
  objects,
  bucketName,
  toggled,
  isVersioningType,
  prefixWithSlash,
}: Props) {
  const { accountName } = useParams<{ accountName: string }>();
  const { pathname } = useLocation();
  const query = useQueryParams();
  const [isTableScrollbarVisible] = useState(false);
  const [tableWidth] = useState(0);
  const dispatch = useDispatch();
  const { bucketName: bucketNameParam } = useParams();

  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );
  const objectsLength = objects.size;
  const isToggledFull = toggled.size > 0 && toggled.size === objectsLength;

  const handleFolderClicked = useCallback(
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

  const columns = useMemo(() => {
    const columns = [
      {
        Header: 'Name',
        accessor: 'name',
        cellStyle: {
          flex: '3',
        },

        Cell({ row: { original } }: CellProps) {
          if (original.isFolder) {
            return (
              <span>
                <Icon className="far fa-folder"></Icon>
                <T.CellClick
                  onClick={handleFolderClicked(bucketName, original.key)}
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
              <T.CellA
                href={original.signedUrl}
                download={`${bucketName}-${original.key}`}
              >
                {original.name}
              </T.CellA>
            </span>
          );
        },
      },
    ];
    if (isVersioningType) {
      columns.push({
        Header: 'Version ID',
        accessor: 'versionId',
        cellStyle: {
          overflow: 'visible',
        },

        Cell({ value: versionId }: { value: string }) {
          return <MiddleEllipsis width={tableWidth} text={versionId} />;
        },
      });
    }
    columns.push(
      {
        Header: 'Modified on',
        accessor: 'lastModified',
        cellStyle: {
          flex: '1',
          textAlign: 'right',
        },
      },
      {
        id: 'size',
        Header: 'Size',
        cellStyle: {
          textAlign: 'right',
          flex: '0.5',
          marginRight: isTableScrollbarVisible ? spacing.sp8 : spacing.sp16,
        },
        accessor: (row) => (row.size ? row.size : ''),
        Cell({ value: size }: { value: number }) {
          return (
            <TextAligner alignment={'right'}>
              {PrettyBytes({ bytes: size })}
            </TextAligner>
          );
        },
      },
      {
        Header: 'Storage Location',
        accessor: 'storageClass',
        cellStyle: {
          flex: '1',
          textAlign: 'right',
          paddingRight: spacing.sp16,
        },
        Cell({ value: storageClass }: { value: string }) {
          return (
            <div>
              {locations.storageClass?.isCold ? <ColdStorageIcon /> : ''}{' '}
              {storageClass === 'STANDARD' ? 'default' : storageClass}
            </div>
          );
        },
      },
    );

    return columns;
  }, [
    bucketName,
    dispatch,
    handleFolderClicked,
    isTableScrollbarVisible,
    isToggledFull,
    isVersioningType,
    isVersioningDisabled,
    tableWidth,
  ]);

  const searchInput = query.get('metadatasearch');
  const objectList = useMemo(
    () => objects.toJS(),
    [objects.size],
  ) as ObjectEntity[];

  const initiallySelectedRowsIds = useMemo(() => {
    const initiallySelectedRowsIds = new Set<string>();
    toggled.forEach((toggledObject) =>
      initiallySelectedRowsIds.add(
        getUniqueObjectID(
          toggledObject.key,
          toggledObject.versionId,
          isVersioningType,
        ),
      ),
    );

    return initiallySelectedRowsIds;
  }, []);

  const handleRowSelected = useCallback((row) => {
    console.log('handleRowSelected');
    const selectedObject = getObject(
      objects,
      row.original.key,
      row.original.versionId,
      isVersioningType,
    );

    mutateQuery(query, row.original.key, row.original.versionId);
    if (!selectedObject.isFolder && !selectedObject.isDeleteMarker) {
      dispatch(
        getObjectMetadata(
          bucketNameParam,
          selectedObject.key,
          !selectedObject.isLatest ? selectedObject.versionId : null,
        ),
      );
    }

    dispatch(push(`${pathname}?${query.toString()}`));
    dispatch(toggleAllObjects(false)); // keep only one selected
    dispatch(toggleObject(row.original.key, row.original.versionId));
  }, []);

  const handleMultipleRowsSelected = useCallback(
    (rows: Row<Record<string, unknown>>[]) => {
      console.log('handleMultipleRowsSelected');
      if (rows.length === 0) {
        query.delete('prefix');
        query.delete('versionId');
        dispatch(push(`${pathname}?${query.toString()}`));
        dispatch(toggleAllObjects(false));
      } else {
        if (rows.length === objects.size) {
          dispatch(toggleAllObjects(true));
        } else {
          rows.forEach((row) => {
            const object = getObject(
              objects,
              row.original.key,
              row.original.versionId,
              isVersioningType,
            );
            if (!object.toggled) {
              dispatch(toggleObject(object.key, object.versionId));
            }
          });
        }
      }
    },
    [],
  );

  return (
    <T.ContainerWithSubHeader>
      <Table
        columns={columns}
        data={objectList}
        defaultSortingKey="storageClass"
        getRowId={(originalRow) =>
          getUniqueObjectID(
            originalRow.key,
            originalRow.versionId,
            isVersioningType,
          )
        }
        onBottom={() => {
          if (!searchInput) {
            return dispatch(continueListObjects(bucketName, prefixWithSlash));
          } else {
            return dispatch(continueSearchObjects(bucketName, searchInput));
          }
        }}
        initiallySelectedRowsIds={initiallySelectedRowsIds}
      >
        <Table.MultiSelectableContent
          rowHeight="h40"
          separationLineVariant="backgroundLevel3"
          backgroundVariant="backgroundLevel1"
          onSingleRowSelected={handleRowSelected}
          onMultiSelectionChanged={handleMultipleRowsSelected}
        />
      </Table>
    </T.ContainerWithSubHeader>
  );
}
