import React from 'react';

import Overview from './details/Overview';
import Workflow from './details/Workflow';
import { Warning } from '../../ui-elements/Warning';
import { useLocation } from 'react-router-dom';
import { WorkflowScheduleUnitState } from '../../../types/stats';
import { useQueryParams } from '../../utils/hooks';
import { Icon } from '@scality/core-ui';
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
  const { pathname } = useLocation();
  const query = useQueryParams();
  const queryObject = Object.fromEntries(query.entries());

  return (
    <>
      {bucket && (
        <Tabs>
          <Tabs.Tab
            label="Overview"
            path={pathname}
            query={{ ...queryObject, tab: null }}
          >
            <Overview bucket={bucket} ingestionStates={ingestionStates} />
          </Tabs.Tab>
          <Tabs.Tab
            label="Workflow"
            path={pathname}
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
