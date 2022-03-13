import { AppState } from '../../types/state';
import { ContentSection, CreationSection } from '../ui-elements/ListLayout3';
import Table, * as T from '../ui-elements/TableKeyValue2';
import Replication from './replication/Replication';
import { useSelector } from 'react-redux';

const CreateWorkflow = () => {
  const replications = useSelector(
    (state: AppState) => state.workflow.replications,
  );
  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );

  const bucketList = useSelector(
    (state: AppState) => state.s3.listBucketsResults.list,
  );

  return (
    <ContentSection>
      <CreationSection>
        <Table id="">
          <T.Body autoComplete="off">
            <T.Title> Create New Workflow </T.Title>
            <T.Subtitle> All * are mandatory fields </T.Subtitle>
            <Replication
              loading={loading}
              showEditWorkflowNotification={false}
              workflow={null}
              replications={replications}
              bucketList={bucketList}
              locations={locations}
              createMode={true}
            />
          </T.Body>
        </Table>
      </CreationSection>
    </ContentSection>
  );
};

export default CreateWorkflow;
