import {
  FormattedDateTime,
  IconHelp,
  PrettyBytes,
  Text,
} from '@scality/core-ui';
import { LatestUsedCapacity } from '../../domain/entities/metrics';
import { PromiseResult } from '../../domain/entities/promise';

export function UsedCapacityInlinePromiseResult({
  result,
}: {
  result: PromiseResult<LatestUsedCapacity>;
}) {
  if (result.status === 'loading') return <>Loading...</>;
  if (result.status === 'unknown') return <>Loading...</>;
  if (result.status === 'error') return <>Error</>;

  return <UsedCapacity value={result.value} />;
}

export function UsedCapacity({ value }: { value: LatestUsedCapacity }) {
  if (value.type === 'error') return <>Error</>;
  if (value.type === 'noMetrics') return <>-</>;

  const totalObjects =
    value.usedCapacity.current + value.usedCapacity.nonCurrent;
  return (
    <>
      <PrettyBytes bytes={totalObjects} />{' '}
      <IconHelp
        placement="top"
        overlayStyle={{ width: '24rem' }}
        tooltipMessage={
          <>
            <Text isGentleEmphazed>
              Retrieved on{' '}
              <FormattedDateTime
                format="date-time-second"
                value={value.measuredOn}
              />
            </Text>
          </>
        }
      />
    </>
  );
}
