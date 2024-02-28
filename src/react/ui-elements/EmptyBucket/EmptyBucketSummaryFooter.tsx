import { Wrap } from '@scality/core-ui/dist/spacing';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
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
