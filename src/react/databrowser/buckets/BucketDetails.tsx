import { Icon } from '@scality/core-ui';
import { WorkflowScheduleUnitState } from '../../../types/stats';
import { Warning } from '../../ui-elements/Warning';
import { useQueryParams } from '../../utils/hooks';
import Overview from './details/Overview';
import Workflow from './details/Workflow';
import { Tabs } from '@scality/core-ui/dist/next';
import { Bucket } from '../../next-architecture/domain/entities/bucket';

type Props = {
  bucket: Bucket | null;
  ingestionStates: WorkflowScheduleUnitState | null | undefined;
};

const NotFound = () => (
  <Warning
    icon={<Icon name="Exclamation-triangle" size="3x" />}
    title="Bucket not found."
  />
);

function BucketDetails({ bucket, ingestionStates }: Props) {
  const query = useQueryParams();
  const queryObject = Object.fromEntries(query.entries());

  return (
    <>
      {bucket && (
        <Tabs>
          <Tabs.Tab
            label="Overview"
            path={''}
            query={{ ...queryObject, tab: null }}
          >
            <Overview bucket={bucket} ingestionStates={ingestionStates} />
          </Tabs.Tab>
          <Tabs.Tab
            label="Workflow"
            path={''}
            query={{ ...queryObject, tab: 'workflow' }}
            withoutPadding
          >
            <Workflow bucketName={bucket.name}></Workflow>
          </Tabs.Tab>
        </Tabs>
      )}
      {!bucket && <NotFound />}
    </>
  );
}

export default BucketDetails;
