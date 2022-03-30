import React from 'react';
import { ContentSection } from '../../ui-elements/ListLayout2';
import { CustomTabs } from '../../ui-elements/Tabs';
import Overview from './details/Overview';
import Workflow from './details/Workflow.tsx';
import type { S3Bucket } from '../../../types/s3';
import { Warning } from '../../ui-elements/Warning';
import { useLocation } from 'react-router-dom';
import type { WorkflowScheduleUnitState } from '../../../types/stats';
import { useQueryParams } from '../../utils/hooks';

type Props = {
  bucket: S3Bucket | null | undefined;
  ingestionStates: WorkflowScheduleUnitState | null | undefined;
};

const NotFound = () => (
  <Warning
    iconClass="fas fa-3x fa-exclamation-triangle"
    title="Bucket not found."
  />
);

function BucketDetails({ bucket, ingestionStates }: Props) {
  const { pathname } = useLocation();
  const query = useQueryParams();
  const tabName = query.get('tab');
  const queryObject = Object.fromEntries(query.entries());

  const details = () => {
    if (!bucket) {
      return <NotFound />;
    }

    if (tabName === 'workflow') {
      return <Workflow bucketName={bucket.Name}></Workflow>;
    } else
      return <Overview bucket={bucket} ingestionStates={ingestionStates} />;
  };

  return (
    <ContentSection>
      <CustomTabs>
        <CustomTabs.Tab label="Overview" path={pathname}>
          {details()}
        </CustomTabs.Tab>
        <CustomTabs.Tab
          label="Workflow"
          path={pathname}
          query={{ ...queryObject, tab: 'workflow' }}
        >
          {details()}
        </CustomTabs.Tab>
      </CustomTabs>
    </ContentSection>
  );
}

export default BucketDetails;
