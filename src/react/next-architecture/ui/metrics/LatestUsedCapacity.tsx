import {
  FormattedDateTime,
  IconHelp,
  PrettyBytes,
  Stack,
  Text,
  Tooltip,
  Wrap,
} from '@scality/core-ui';
import { LatestUsedCapacity } from '../../domain/entities/metrics';
import { PromiseResult } from '../../domain/entities/promise';
import { EmptyCell } from '@scality/core-ui/dist/components/tablev2/Tablev2.component';
import {
  TooltipContent,
  UnknownIcon,
} from '@scality/core-ui/dist/components/tablev2/Tablestyle';
import { Box } from '@scality/core-ui/dist/next';

export function UsedCapacityInlinePromiseResult({
  result,
}: {
  result: PromiseResult<LatestUsedCapacity>;
}) {
  if (result.status === 'loading') return <>Loading...</>;
  if (result.status === 'unknown') return <>Loading...</>;
  if (result.status === 'error') return <>Error</>;

  if (!result.value)
    return (
      <Box>
        <Tooltip overlay={<TooltipContent>unknown</TooltipContent>}>
          <UnknownIcon className="fas fa-minus"></UnknownIcon>
        </Tooltip>
      </Box>
    );
  return <UsedCapacity value={result.value} />;
}

export function UsedCapacity({ value }: { value: LatestUsedCapacity }) {
  if (value.type === 'error') return <>Error</>;
  if (value.type === 'noMetrics')
    return (
      <Box>
        <Tooltip overlay={<TooltipContent>unknown</TooltipContent>}>
          <UnknownIcon className="fas fa-minus"></UnknownIcon>
        </Tooltip>
      </Box>
    );

  const totalObjects =
    value.usedCapacity.current + value.usedCapacity.nonCurrent;
  return (
    <Wrap>
      <div></div>
      <Stack>
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
      </Stack>
    </Wrap>
  );
}
