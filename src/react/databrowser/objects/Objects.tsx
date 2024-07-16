import { useEffect, useMemo, useState } from 'react';
import { Redirect, useHistory, useParams } from 'react-router-dom';
import {
  getObjectMetadata,
  listObjects,
  resetObjectMetadata,
  newSearchListing,
} from '../../actions';
import { UPLOADING_OBJECT } from '../../actions/s3object';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../../../types/state';
import FolderCreate from './FolderCreate';
import {
  LIST_OBJECTS_S3_TYPE,
  LIST_OBJECT_VERSIONS_S3_TYPE,
} from '../../utils/s3';
import ObjectDelete from './ObjectDelete';
import ObjectDetails from './ObjectDetails';
import ObjectList from './ObjectList';
import ObjectUpload from './ObjectUpload';
import { usePrefixWithSlash, useQueryParams } from '../../utils/hooks';
import { AppContainer, TwoPanelLayout } from '@scality/core-ui';
import ObjectHead from './ObjectHead';

export default function Objects() {
  const dispatch = useDispatch();
  const [loaded, setLoaded] = useState(false);
  const objects = useSelector(
    (state: AppState) => state.s3.listObjectsResults.list,
  );
  const listType = useSelector((state: AppState) => state.s3.listObjectsType);
  const isUploading = useSelector((state: AppState) =>
    state.networkActivity.messages.includes(UPLOADING_OBJECT),
  );

  /* this depends on onbeforeunload https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload#browser_compatibility
   it can't run custom modal or alert, and will display a generic message in all major up to date browser, that can't be customize
   the string is mandatory to display the popup but will likely not be displayed */
  window.onbeforeunload = function () {
    if (isUploading) {
      return 'If you quit the Data Browser, the current upload process will abort';
    }

    return;
  };

  const query = useQueryParams();
  const isShowVersions = query.get('showversions') === 'true';
  const searchInput = query.get('metadatasearch');
  const objectKey = query.get('prefix');
  const versionId = query.get('versionId');
  const history = useHistory();
  const toggled = useMemo(
    () =>
      objects.filter(
        (o) =>
          o.toggled ||
          (!isShowVersions && o.key === objectKey) ||
          (isShowVersions && o.key === objectKey && o.versionId === versionId),
      ),
    [objects, isShowVersions, objectKey, versionId],
  );
  const { bucketName: bucketNameParam } = useParams<{ bucketName: string }>();
  const prefixWithSlash = usePrefixWithSlash();
  useEffect(() => {
    if (searchInput) {
      dispatch(
        newSearchListing(bucketNameParam, searchInput, isShowVersions),
        //@ts-expect-error fix this when you are working on it
      ).finally(() => setLoaded(true));
    } else {
      dispatch(
        listObjects(
          bucketNameParam,
          prefixWithSlash,
          isShowVersions ? LIST_OBJECT_VERSIONS_S3_TYPE : LIST_OBJECTS_S3_TYPE,
        ),
        //@ts-expect-error fix this when you are working on it
      ).finally(() => setLoaded(true));
    }
  }, [bucketNameParam, prefixWithSlash, dispatch, isShowVersions, searchInput]);

  // NOTE: If only one unique object (not folder) is selected, we show its metadata.
  //       Otherwise, we clear object metadata.
  useEffect(() => {
    // wait for objects to be listed.
    if (!loaded) {
      return;
    }

    const firstToggledItem = toggled.first();

    if (
      toggled.size === 1 &&
      !firstToggledItem.isFolder &&
      !firstToggledItem.isDeleteMarker
    ) {
      dispatch(
        getObjectMetadata(
          bucketNameParam,
          firstToggledItem.key,
          !firstToggledItem.isLatest ? firstToggledItem.versionId : null,
        ),
      );
    } else {
      dispatch(resetObjectMetadata());
    }
  }, [dispatch, bucketNameParam, toggled, loaded]);

  if (!loaded) {
    return (
      <AppContainer.OverallSummary>
        <ObjectHead />
      </AppContainer.OverallSummary>
    );
  }

  if (!bucketNameParam) {
    return <Redirect to={'/buckets'} />;
  }

  // TODO: manage empty state
  // if (objects.size === 0) {
  //   return (
  //     <EmptyState
  //       icon="Node-backend"
  //       link={`/buckets/${bucketNameParam}/upload-object`}
  //       listedResource="Object"
  //     ></EmptyState>
  //   );
  // }
  return (
    <>
      <AppContainer.OverallSummary>
        <ObjectHead bucketName={bucketNameParam} />
      </AppContainer.OverallSummary>
      {/* MODALS */}
      <ObjectDelete
        bucketName={bucketNameParam}
        toggled={toggled}
        prefixWithSlash={prefixWithSlash}
      />
      <ObjectUpload bucketName={bucketNameParam} />
      <FolderCreate
        bucketName={bucketNameParam}
        prefixWithSlash={prefixWithSlash}
      />
      <AppContainer.MainContent background="backgroundLevel1">
        <TwoPanelLayout
          panelsRatio="65-35"
          leftPanel={{
            children: (
              <ObjectList
                toggled={toggled}
                objects={objects}
                bucketName={bucketNameParam}
                prefixWithSlash={prefixWithSlash}
                listType={listType}
              />
            ),
          }}
          rightPanel={{
            children: <ObjectDetails toggled={toggled} listType={listType} />,
          }}
        />
      </AppContainer.MainContent>
    </>
  );
}
