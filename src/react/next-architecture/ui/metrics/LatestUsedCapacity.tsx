import {
  FormattedDateTime,
  IconHelp,
  PrettyBytes,
  Stack,
  Text,
  Wrap,
} from '@scality/core-ui';
import { LatestUsedCapacity } from '../../domain/entities/metrics';
import { PromiseResult } from '../../domain/entities/promise';
import { EmptyCell } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';

export function UsedCapacityInlinePromiseResult({
  result,
}: {
  result: PromiseResult<LatestUsedCapacity>;
}) {
  if (result.status === 'loading') return <>Loading...</>;
  if (result.status === 'unknown') return <>Loading...</>;
  if (result.status === 'error') return <>Error</>;

  if (!result.value) return <EmptyCell mr={0} />;

  return <UsedCapacity value={result.value} />;
}

export function UsedCapacity({ value }: { value: LatestUsedCapacity }) {
  if (value.type === 'error') return <>Error</>;
  if (value.type === 'noMetrics') return <EmptyCell mr={0} />;

  const totalObjects =
    value.usedCapacity.current + value.usedCapacity.nonCurrent;
  return (
    <Wrap>
      <div></div>
      <Stack>
        <PrettyBytes bytes={totalObjects} decimals={2} />{' '}
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
      </Stack>
    </Wrap>
  );
}
