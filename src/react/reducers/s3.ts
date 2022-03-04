import {
  LIST_OBJECTS_METADATA_TYPE,
  LIST_OBJECTS_S3_TYPE,
  LIST_OBJECT_VERSIONS_S3_TYPE,
  mergeSortedVersionsAndDeleteMarkers,
} from '../utils/s3';
import {
  METADATA_SYSTEM_TYPE,
  METADATA_USER_TYPE,
  formatShortDate,
  stripQuotes,
  systemMetadataKeys,
} from '../utils';
import type {
  MetadataPairs,
  ObjectEntity,
  S3DeleteMarker,
  S3Object,
  S3Version,
  TagSet,
  Tags,
} from '../../types/s3';
import type {
  GetObjectMetadataSuccessAction,
  S3Action,
} from '../../types/actions';
import type { SearchResult } from '../../types/zenko';
import { List } from 'immutable';
import type { S3State } from '../../types/state';
import { initialS3State } from './initialConstants';

const sortByDate = (objs) =>
  objs.sort((a, b) => new Date(b.CreationDate) - new Date(a.CreationDate));

const objects = (objs, prefix): Array<ObjectEntity> =>
  objs
    .filter((o) => o.Key !== prefix)
    .map((o) => {
      return {
        name: o.Key.replace(prefix, ''),
        key: o.Key,
        lastModified: formatShortDate(new Date(o.LastModified)),
        size: o.Size,
        isFolder: false,
        toggled: false,
        isLatest: true,
        signedUrl: o.SignedUrl,
        ..._getObjectLockInformation(o),
        isLegalHoldEnabled: o.IsLegalHoldEnabled,
      };
    });

const folder = (objs, prefix): Array<ObjectEntity> =>
  objs.map((o) => {
    return {
      name: o.Prefix.replace(prefix, ''),
      key: o.Prefix,
      isFolder: true,
      isLatest: true,
      toggled: false,
      lockStatus: 'NONE',
    };
  });

const _getObjectLockInformation = (
  o:
    | S3Object
    | S3Version
    | SearchResult
    | S3DeleteMarker
    | GetObjectMetadataSuccessAction,
) => {
  return {
    lockStatus:
      o.ObjectRetention &&
      new Date(o.ObjectRetention.RetainUntilDate) >= new Date()
        ? 'LOCKED'
        : o.ObjectRetention &&
          new Date(o.ObjectRetention.RetainUntilDate) < new Date()
        ? 'RELEASED'
        : 'NONE',
    objectRetention: o.ObjectRetention
      ? {
          mode: o.ObjectRetention.Mode,
          retainUntilDate: formatShortDate(
            new Date(o.ObjectRetention.RetainUntilDate),
          ),
        }
      : undefined,
  };
};

const search = (objs): Array<ObjectEntity> => {
  return objs.map((o) => {
    return {
      name: o.Key,
      key: o.Key,
      lastModified: formatShortDate(new Date(o.LastModified)),
      size: o.Size,
      isFolder: o.IsFolder,
      isLatest: true,
      signedUrl: o.SignedUrl,
      ..._getObjectLockInformation(o),
      toggled: false,
      isLegalHoldEnabled: o.IsLegalHoldEnabled,
    };
  });
};

const versioning = (
  versions: Array<S3Version>,
  deleteMarkers: Array<S3DeleteMarker>,
  prefix,
) => {
  const results = mergeSortedVersionsAndDeleteMarkers(versions, deleteMarkers);
  return results
    .filter((o) => o.Key !== prefix)
    .map((o) => {
      return {
        name: o.Key.replace(prefix, ''),
        key: o.Key,
        lastModified: formatShortDate(new Date(o.LastModified)),
        size: o.Size || null,
        isFolder: false,
        isLatest: o.IsLatest,
        isDeleteMarker: o.ETag ? false : true,
        versionId: o.VersionId,
        signedUrl: o.SignedUrl || null,
        ..._getObjectLockInformation(o),
        toggled: false,
        isLegalHoldEnabled: o.IsLegalHoldEnabled || false,
      };
    });
};

const convertToFormMetadata = (info): MetadataPairs => {
  const pairs = systemMetadataKeys
    .filter((key) => info[key])
    .map((key) => {
      return {
        key: key,
        value: info[key],
        type: METADATA_SYSTEM_TYPE,
      };
    });

  for (const key in info.Metadata) {
    pairs.push({
      key: key,
      value: info.Metadata[key],
      type: METADATA_USER_TYPE,
    });
  }

  return pairs;
};

const convertToFormTags = (tags: TagSet): Tags =>
  tags.map((t) => ({
    key: t.Key,
    value: t.Value,
  }));

export default function s3(state: S3State = initialS3State, action: S3Action) {
  switch (action.type) {
    case 'LIST_BUCKETS_SUCCESS':
      return {
        ...state,
        listBucketsResults: {
          list: List(sortByDate(action.list)),
          ownerName: action.ownerName,
        },
      };

    case 'GET_BUCKET_INFO_SUCCESS':
      return { ...state, bucketInfo: action.info };

    case 'LIST_OBJECTS_SUCCESS':
      return {
        ...state,
        listObjectsType: LIST_OBJECTS_S3_TYPE,
        listObjectsResults: {
          list: List([
            ...folder(action.commonPrefixes, action.prefix),
            ...objects(action.contents, action.prefix),
          ]),
          nextMarker: action.nextMarker,
        },
      };

    case 'CONTINUE_LIST_OBJECTS_SUCCESS':
      return {
        ...state,
        listObjectsType: LIST_OBJECTS_S3_TYPE,
        listObjectsResults: {
          list: state.listObjectsResults.list.push(
            ...folder(action.commonPrefixes, action.prefix),
            ...objects(action.contents, action.prefix),
          ),
          nextMarker: action.nextMarker,
        },
      };

    case 'LIST_OBJECT_VERSIONS_SUCCESS':
      return {
        ...state,
        listObjectsType: LIST_OBJECT_VERSIONS_S3_TYPE,
        listObjectsResults: {
          list: List([
            ...folder(action.commonPrefixes, action.prefix),
            ...versioning(action.versions, action.deleteMarkers, action.prefix),
          ]),
          nextMarker: action.nextMarker,
          nextVersionIdMarker: action.nextVersionIdMarker,
        },
      };

    case 'CONTINUE_LIST_OBJECT_VERSIONS_SUCCESS':
      return {
        ...state,
        listObjectsType: LIST_OBJECT_VERSIONS_S3_TYPE,
        listObjectsResults: {
          list: state.listObjectsResults.list.push(
            ...folder(action.commonPrefixes, action.prefix),
            ...versioning(action.versions, action.deleteMarkers, action.prefix),
          ),
          nextMarker: action.nextMarker,
          nextVersionIdMarker: action.nextVersionIdMarker,
        },
      };

    case 'ZENKO_CLIENT_WRITE_SEARCH_LIST':
      return {
        ...state,
        listObjectsType: LIST_OBJECTS_METADATA_TYPE,
        listObjectsResults: {
          list: List(search(action.list)),
          nextMarker: action.nextMarker,
        },
      };

    case 'TOGGLE_OBJECT':
      return {
        ...state,
        listObjectsResults: {
          ...state.listObjectsResults,
          list: state.listObjectsResults.list.map((o) =>
            o.key === action.objectKey && o.versionId === action.versionId
              ? { ...o, toggled: !o.toggled }
              : o,
          ),
        },
      };

    case 'TOGGLE_ALL_OBJECTS':
      return {
        ...state,
        listObjectsResults: {
          ...state.listObjectsResults,
          list: state.listObjectsResults.list.map((o) => ({
            ...o,
            toggled: action.toggled,
          })),
        },
      };

    case 'GET_OBJECT_METADATA_SUCCESS':
      return {
        ...state,
        objectMetadata: {
          bucketName: action.bucketName,
          objectKey: action.objectKey,
          lastModified: action.info.LastModified,
          contentLength: action.info.ContentLength,
          eTag: stripQuotes(action.info.ETag),
          versionId: action.info.VersionId,
          metadata: convertToFormMetadata(action.info),
          tags: convertToFormTags(action.tags),
          ..._getObjectLockInformation(action),
          isLegalHoldEnabled: action.isLegalHoldEnabled,
        },
      };

    case 'RESET_OBJECT_METADATA':
      return { ...state, objectMetadata: null };

    default:
      return state;
  }
}
