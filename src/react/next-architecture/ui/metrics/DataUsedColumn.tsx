import { CoreUIColumn } from 'react-table';
import { LatestUsedCapacity } from '../../domain/entities/metrics';
import { PromiseResult } from '../../domain/entities/promise';
import { CellProps } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import { CSSProperties, useMemo } from 'react';
import { UsedCapacityInlinePromiseResult } from './LatestUsedCapacity';

export function getDataUsedColumn<
  T extends {
    usedCapacity: PromiseResult<LatestUsedCapacity>;
  },
>(
  useLatestUsedCapacity: (item: T) => {
    usedCapacity: PromiseResult<LatestUsedCapacity>;
  },
  cellStyle?: CSSProperties,
): CoreUIColumn<T> {
  return {
    Header: 'Data Used',
    accessor: 'usedCapacity' as const,
    sortType: (rowA, rowB) => {
      const a = rowA.original.usedCapacity;
      const b = rowB.original.usedCapacity;
      if (
        a.status === 'success' &&
        a.value.type === 'hasMetrics' &&
        b.status === 'success' &&
        b.value.type === 'hasMetrics'
      ) {
        return (
          a.value.usedCapacity.current +
          a.value.usedCapacity.nonCurrent -
          (b.value.usedCapacity.current + b.value.usedCapacity.nonCurrent)
        );
      } else if (
        a.status === 'success' &&
        a.value.type === 'hasMetrics' &&
        b.status === 'success' &&
        b.value.type === 'noMetrics'
      ) {
        return 1;
      } else if (
        a.status === 'success' &&
        a.value.type === 'noMetrics' &&
        b.status === 'success' &&
        b.value.type === 'hasMetrics'
      ) {
        return -1;
      } else {
        return 0;
      }
    },
    cellStyle: {
      textAlign: 'right',
      ...cellStyle,
    },
    Cell: ({
      row,
      updateTableData,
      value,
    }: CellProps<T, T['usedCapacity']>) => {
      const { usedCapacity } = useLatestUsedCapacity(row.original);

      useMemo(() => {
        if (
          usedCapacity.status === 'success' &&
          value.status !== 'success' &&
          updateTableData
        ) {
          updateTableData(row.id, 'usedCapacity', usedCapacity);
        }
      }, [usedCapacity.status, updateTableData]);

      return <UsedCapacityInlinePromiseResult result={usedCapacity} />;
    },
  };
}
