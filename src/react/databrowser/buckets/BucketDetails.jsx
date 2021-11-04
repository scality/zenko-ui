// @flow
import { ContentSection } from '../../ui-elements/ListLayout2';
import { CustomTabs } from '../../ui-elements/Tabs';
import Overview from './details/Overview';
import React from 'react';
import type { S3Bucket } from '../../../types/s3';
import { Warning } from '../../ui-elements/Warning';
import { useLocation } from 'react-router-dom';
import type { WorkflowScheduleUnitState } from '../../../types/stats';

type Props = {
  bucket: ?S3Bucket,
  ingestionStates: ?WorkflowScheduleUnitState,
};

const NotFound = () => (
  <Warning
    iconClass="fas fa-3x fa-exclamation-triangle"
    title="Bucket not found."
  />
);

function BucketDetails({ bucket, ingestionStates }: Props) {
  const { pathname } = useLocation();

  const details = () => {
    if (!bucket) {
      return <NotFound />;
    }
    return <Overview bucket={bucket} ingestionStates={ingestionStates} />;
  };

  return (
    <ContentSection>
      <CustomTabs>
        <CustomTabs.Tab label="Overview" path={pathname}>
          {details()}
        </CustomTabs.Tab>
      </CustomTabs>
    </ContentSection>
  );
}

export default BucketDetails;
