import { Icon, Loader, Stack, Text, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import {
  EMPTY_APPROVE_BUTTON_LABEL,
  EMPTY_CANCEL_BUTTON_LABEL,
} from './constants';

type EmptyBucketModalFooterProps = {
  approve: () => void;
  cancel: () => void;
  loading?: boolean;
  isConfirm?: boolean;
  deleteNumber?: number;
};

export const EmptyBucketModalFooter = ({
  approve,
  cancel,
  loading = false,
  isConfirm = false,
  deleteNumber,
}: EmptyBucketModalFooterProps) => {
  return (
    <Wrap>
      {loading ? (
        <Text variant="Larger">
          {deleteNumber
            ? `${deleteNumber} deletion attempts...`
            : 'Deletion in progress...'}
        </Text>
      ) : null}
      <p></p>
      <Stack>
        <Button
          variant="outline"
          onClick={cancel}
          label={EMPTY_CANCEL_BUTTON_LABEL}
        />
        <Button
          disabled={!isConfirm || loading}
          variant="danger"
          onClick={approve}
          icon={loading ? <Loader size="larger" /> : <Icon name="Eraser" />}
          label={EMPTY_APPROVE_BUTTON_LABEL}
        />
      </Stack>
    </Wrap>
  );
};
