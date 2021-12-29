// @flow
import * as L from '../../ui-elements/ListLayout2';
import React, { useEffect, useMemo, useState } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import {
  getBucketInfo,
  getObjectMetadata,
  listObjects,
  resetObjectMetadata,
} from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import FolderCreate from './FolderCreate';
import {
  LIST_OBJECTS_S3_TYPE,
  LIST_OBJECT_VERSIONS_S3_TYPE,
} from '../../utils/s3';
import ObjectDelete from './ObjectDelete';
import ObjectDetails from './ObjectDetails';
import ObjectHead from './ObjectHead';
import ObjectList from './ObjectList';
import ObjectUpload from './ObjectUpload';
import { addTrailingSlash } from '../../utils';
import { useQuery } from '../../utils/hooks';

export default function Objects() {
  const dispatch = useDispatch();

  const [loaded, setLoaded] = useState(false);

  const objects = useSelector(
    (state: AppState) => state.s3.listObjectsResults.list,
  );
  const listType = useSelector((state: AppState) => state.s3.listObjectsType);
  const bucketInfo = useSelector((state: AppState) => state.s3.bucketInfo);

  const toggled = useMemo(() => objects.filter(o => o.toggled), [objects]);

  const { bucketName: bucketNameParam, '0': prefixParam } = useParams();
  const prefixWithSlash = addTrailingSlash(prefixParam);

  const query = useQuery();
  const isShowVersions =
    query.get('showversions') === LIST_OBJECT_VERSIONS_S3_TYPE;

  useEffect(() => {
    dispatch(
      listObjects(
        bucketNameParam,
        prefixWithSlash,
        isShowVersions ? LIST_OBJECT_VERSIONS_S3_TYPE : LIST_OBJECTS_S3_TYPE,
      ),
    ).finally(() => setLoaded(true));
  }, [bucketNameParam, prefixWithSlash, dispatch, isShowVersions]);

  useEffect(() => {
    dispatch(getBucketInfo(bucketNameParam));
  }, [dispatch, bucketNameParam]);

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
          firstToggledItem.versionId,
        ),
      );
    } else {
      dispatch(resetObjectMetadata());
    }
  }, [dispatch, bucketNameParam, toggled, loaded]);

  if (!loaded || !bucketInfo) {
    return <ObjectHead />;
  }

  if (!bucketNameParam) {
    return <Redirect to={'/buckets'} />;
  }

  // TODO: manage empty state
  // if (objects.size === 0) {
  //     return <EmptyStateContainer>
  //         <Warning
  //             iconClass="fas fa-5x fa-wallet"
  //             title='This bucket is empty. Upload new objects to get started.'
  //             btnTitle='Upload'
  //             btnAction={() => dispatch(push(`/buckets/${bucketNameParam}/upload-object`))} />
  //     </EmptyStateContainer>;
  // }

  return (
    <L.ContentContainer>
      <ObjectDelete
        bucketInfo={bucketInfo}
        bucketName={bucketNameParam}
        toggled={toggled}
        prefixWithSlash={prefixWithSlash}
      />
      <ObjectUpload
        bucketName={bucketNameParam}
        prefixWithSlash={prefixWithSlash}
      />
      <FolderCreate
        bucketName={bucketNameParam}
        prefixWithSlash={prefixWithSlash}
      />
      <ObjectHead bucketName={bucketNameParam} />

      <L.Body>
        <ObjectList
          bucketInfo={bucketInfo}
          toggled={toggled}
          objects={objects}
          bucketName={bucketNameParam}
          prefixWithSlash={prefixWithSlash}
          listType={listType}
        />
        <ObjectDetails toggled={toggled} listType={listType} />
      </L.Body>
    </L.ContentContainer>
  );
}
