import { Icon, Stack, Text } from '@scality/core-ui';
import React from 'react';
type Props = {
  bucketName?: string;
};
export default function ObjectHead({ bucketName }: Props) {
  return (
    <Stack gap="r16">
      <Icon name="Bucket" color="infoPrimary" size="2x" withWrapper />
      <Text variant="Large">{bucketName}</Text>
    </Stack>
  );
}
