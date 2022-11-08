import { Icon, Stack, Text } from '@scality/core-ui';

export function AccountHead({ accountName }: { accountName: string }) {
  return (
    <Stack gap="r16">
      <Icon name="Account" color="infoPrimary" size="2x" withWrapper />
      <Text variant="Larger">{accountName}</Text>
    </Stack>
  );
}
