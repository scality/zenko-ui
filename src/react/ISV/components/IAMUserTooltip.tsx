import { Stack } from '@scality/core-ui';
import { ListItem } from '../modules';

export const IAMUSerTooltip = ({ platform }: { platform: string }) => {
  return (
    <Stack direction="vertical" gap="r8">
      <>
        {`${platform} requires an IAM User with access keys (AK/SK) to use a bucket
        as a backup target within the Object Storage context. The user will have
        IAM policies granting the necessary ${platform} permissions on the
        bucket(s).`}
      </>

      <ul>
        <ListItem>
          {`If a IAM User created via the ${platform} assistant already exists, it
          is recommended to use it (${platform} should recognize and use its
          existing AK/SK).`}
        </ListItem>
        <ListItem>
          {`If a IAM User created via the ${platform} assistant already exists, it
          is recommended to use it (${platform} should recognize and use its
          existing AK/SK).`}
        </ListItem>
        <ListItem>
          {`If no IAM User is available in the account (or if it's a new account),
          a new user will be created automatically, and its AK/SK will be
          provided at the summary step. If needed (like key loss or rotation), a
          new set of AK/SK can be generated for an existing user.`}
        </ListItem>
      </ul>
    </Stack>
  );
};
