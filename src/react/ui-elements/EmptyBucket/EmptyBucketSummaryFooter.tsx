import { Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { CLOSE } from './constants';

type EmptyBucketSummaryFooterProps = {
  close: () => void;
};

export const EmptyBucketSummaryFooter = ({
  close,
}: EmptyBucketSummaryFooterProps) => {
  return (
    <Wrap>
      <p></p>
      <Button variant="primary" onClick={close} label={CLOSE} />
    </Wrap>
  );
};
