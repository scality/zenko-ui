import { Icon } from '@scality/core-ui';
import { ScheduleUnitState } from '../../../types/stats';
import { Warning } from '../../ui-elements/Warning';
import Overview from './details/Overview';
import { Bucket } from '../../next-architecture/domain/entities/bucket';

type Props = {
  bucket: Bucket | null;
  ingestionStates: ScheduleUnitState | null | undefined;
};

const NotFound = () => (
  <Warning
    icon={<Icon name="Exclamation-triangle" size="3x" />}
    title="Bucket not found."
  />
);

function BucketDetails({ bucket, ingestionStates }: Props) {
  return (
    <>
      {bucket && <Overview bucket={bucket} ingestionStates={ingestionStates} />}
      {!bucket && <NotFound />}
    </>
  );
}

export default BucketDetails;
