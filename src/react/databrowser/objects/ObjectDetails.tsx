import { AppState } from '../../../types/state';

import { List } from 'immutable';
import { ListObjectsType } from '../../../types/s3';
import Metadata from './details/Metadata';
import Properties from './details/Properties';
import Tags from './details/Tags';
import { Warning } from '../../ui-elements/Warning';
import { useLocation } from 'react-router-dom';
import { useQueryParams } from '../../utils/hooks';
import { useSelector } from 'react-redux';
import { Tabs } from '@scality/core-ui/dist/next';

export const MULTIPLE_ITEMS_SELECTED_MESSAGE = 'Multiple items selected';
export const SELECT_AN_OBJECT_MESSAGE = 'Select an object';
type Props = {
  toggled: List<Record<string, any>>;
  listType: ListObjectsType;
};
export const InfoWarning = ({ title }: { title: JSX.Element }) => (
  <Warning title={title} centered />
);

const warningTitle = (toggled: List<Record<string, any>>): JSX.Element => {
  if (toggled.size === 1) {
    const firstObject = toggled.first();
    const { isDeleteMarker, isFolder } = firstObject;

    if (isDeleteMarker) {
      //@ts-expect-error fix this when you are working on it
      return 'A "Delete Marker" is selected';
    }

    if (isFolder) {
      //@ts-expect-error fix this when you are working on it
      return 'A "Folder" is selected';
    }
  }

  //@ts-expect-error fix this when you are working on it
  return SELECT_AN_OBJECT_MESSAGE;
};

function ObjectDetails({ toggled, listType }: Props) {
  const query = useQueryParams();
  const { pathname } = useLocation();
  const objectMetadata = useSelector(
    (state: AppState) => state.s3.objectMetadata,
  );
  const tabName = query.get('tab');
  const queryObject = Object.fromEntries(query.entries());

  const details = () => {
    if (toggled.size > 1) {
      //@ts-expect-error fix this when you are working on it
      return <InfoWarning title={MULTIPLE_ITEMS_SELECTED_MESSAGE} />;
    }

    if (!objectMetadata) {
      return <InfoWarning title={warningTitle(toggled)} />;
    }

    if (!tabName) {
      return <Properties objectMetadata={objectMetadata} />;
    }

    if (tabName === 'metadata') {
      return (
        <Metadata
          bucketName={objectMetadata.bucketName}
          objectKey={objectMetadata.objectKey}
          metadata={objectMetadata.metadata}
          listType={listType}
          storageClass={objectMetadata.storageClass}
        />
      );
    }

    if (tabName === 'tags') {
      return (
        <Tags
          bucketName={objectMetadata.bucketName}
          objectKey={objectMetadata.objectKey}
          tags={objectMetadata.tags}
          versionId={objectMetadata.versionId}
        />
      );
    }

    return null;
  };

  return (
    <Tabs>
      <Tabs.Tab
        label="Summary"
        path={pathname}
        query={{ ...queryObject, tab: null }}
      >
        {details()}
      </Tabs.Tab>
      <Tabs.Tab
        label="Metadata"
        path={pathname}
        query={{ ...queryObject, tab: 'metadata' }}
      >
        {details()}
      </Tabs.Tab>
      <Tabs.Tab
        label="Tags"
        path={pathname}
        query={{ ...queryObject, tab: 'tags' }}
      >
        {details()}
      </Tabs.Tab>
    </Tabs>
  );
}

export default ObjectDetails;
