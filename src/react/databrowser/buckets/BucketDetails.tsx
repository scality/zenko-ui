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
import { Icon } from '@scality/core-ui';

type Props = {
  bucket: S3Bucket | null | undefined;
  ingestionStates: WorkflowScheduleUnitState | null | undefined;
};

const NotFound = () => (
  <Warning
    icon={<Icon name="Exclamation-triangle" size="3x" />}
    title="Bucket not found."
  />
);

function BucketDetails({ bucket, ingestionStates }: Props) {
  const { pathname } = useLocation();
  const query = useQueryParams();
  const queryObject = Object.fromEntries(query.entries());

  return (
    <ContentSection>
      {bucket && (
        <CustomTabs>
          <CustomTabs.Tab
            label="Overview"
            path={pathname}
            query={{ ...queryObject, tab: null }}
          >
            <Overview bucket={bucket} ingestionStates={ingestionStates} />
          </CustomTabs.Tab>
          <CustomTabs.Tab
            label="Workflow"
            path={pathname}
            query={{ ...queryObject, tab: 'workflow' }}
          >
            <Workflow bucketName={bucket.Name}></Workflow>
          </CustomTabs.Tab>
        </CustomTabs>
      )}
      {!bucket && <NotFound />}
    </ContentSection>
  );
}

export default BucketDetails;
