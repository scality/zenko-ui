import { Icon, Stack, Text } from '@scality/core-ui';
import ArrowNavigation from '../ui-elements/ArrowNavigation';

export function AccountHead({ accountName }: { accountName: string }) {
  return (
    <Stack gap="r16">
      <ArrowNavigation path="/accounts" label="Return to all accounts" />
      <Icon name="Account" color="infoPrimary" size="2x" withWrapper />
      <Text variant="Larger">{accountName}</Text>
    </Stack>
  );
}
