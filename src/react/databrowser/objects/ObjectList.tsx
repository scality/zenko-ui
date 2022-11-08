import * as T from '../../ui-elements/Table';
import type {
  BucketInfo,
  ListObjectsType,
  ObjectEntity,
} from '../../../types/s3';
import { LIST_OBJECT_VERSIONS_S3_TYPE } from '../../utils/s3';
import { isVersioningDisabled, maybePluralize } from '../../utils';
import {
  openFolderCreateModal,
  openObjectDeleteModal,
  openObjectUploadModal,
} from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { List } from 'immutable';
import MetadataSearch from './MetadataSearch';
import ObjectListTable from './ObjectListTable';
import { Icon, spacing, Toggle } from '@scality/core-ui';
import { WarningMetadata } from '../../ui-elements/Warning';
import { push } from 'connected-react-router';
import { useQueryParams } from '../../utils/hooks';
import { useLocation } from 'react-router';
import { Box } from '@scality/core-ui/dist/next';
type Props = {
  objects: List<ObjectEntity>;
  bucketName: string;
  prefixWithSlash: string;
  toggled: List<ObjectEntity>;
  listType: ListObjectsType;
  bucketInfo: BucketInfo;
};
export default function ObjectList({
  objects,
  bucketName,
  prefixWithSlash,
  toggled,
  listType,
  bucketInfo,
}: Props) {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const query = useQueryParams();
  const searchInput = query.get('metadatasearch');

  const errorZenkoMsg = useSelector(
    (state: AppState) => state.zenko.error.message,
  );
  const isBucketVersioningDisabled = isVersioningDisabled(
    bucketInfo.versioning,
  );

  const isMetadataType = !!searchInput;
  const isVersioningType = listType === LIST_OBJECT_VERSIONS_S3_TYPE;
  const isToggledEmpty = toggled.size === 0;

  const maybeListTable = () => {
    if (errorZenkoMsg) {
      return <WarningMetadata description={errorZenkoMsg} />;
    }

    return (
      <ObjectListTable
        objects={objects}
        isVersioningType={isVersioningType}
        bucketName={bucketName}
        toggled={toggled}
        prefixWithSlash={prefixWithSlash}
      />
    );
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      flex="1"
      id="object-list"
      paddingTop={spacing.r16}
    >
      <T.HeaderContainer>
        <MetadataSearch
          errorZenkoMsg={errorZenkoMsg}
          isMetadataType={isMetadataType}
        />
        <T.ButtonContainer>
          <T.ExtraButton
            id="object-list-upload-button"
            label="Upload"
            icon={<Icon name="Simple-upload" />}
            variant="secondary"
            onClick={() => dispatch(openObjectUploadModal())}
          />
          <T.ExtraButton
            id="object-list-create-folder-button"
            label="Folder"
            icon={<Icon name="Create-add" />}
            variant="secondary"
            onClick={() => dispatch(openFolderCreateModal())}
          />
          <T.ExtraButton
            id="object-list-delete-button"
            label="Delete"
            icon={<Icon name="Delete" />}
            disabled={isToggledEmpty}
            variant="danger"
            onClick={() => dispatch(openObjectDeleteModal())}
          />
          <Toggle
            id="list-versions-toggle"
            disabled={isMetadataType || isBucketVersioningDisabled}
            toggle={isVersioningType}
            label="List Versions"
            onChange={() => {
              query.set('showversions', !isVersioningType ? 'true' : 'false');

              if (isVersioningType) {
                query.delete('versionId');
              }

              dispatch(push(`${pathname}?${query.toString()}`));
            }}
          />
        </T.ButtonContainer>
      </T.HeaderContainer>
      <T.SubHeaderContainer isHidden={!isMetadataType || !!errorZenkoMsg}>
        {' '}
        {maybePluralize(objects.size, 'metadata search result')}{' '}
      </T.SubHeaderContainer>
      {maybeListTable()}
    </Box>
  );
}
