// @flow
import { METADATA_SYSTEM_TYPE, METADATA_USER_TYPE, formatDate, stripQuotes, systemMetadataKeys } from '../utils';
import type { Object, TagSet, Tags } from '../../types/s3';
import { List } from 'immutable';
import type { S3Action } from '../../types/actions';
import type { S3State } from '../../types/state';
import { initialS3State } from './initialConstants';

const sortByDate = objs => objs.sort((a,b) => (new Date(b.CreationDate) - new Date(a.CreationDate)));

const objects = (objs, prefix): Array<Object> => objs.filter(o => o.Key !== prefix).map(o => {
    return {
        name: o.Key.replace(prefix, ''),
        lastModified: formatDate(new Date(o.LastModified)),
        size: o.Size,
        isFolder: false,
        toggled: false,
        signedUrl: o.SignedUrl,
    };
});

const folder = (objs, prefix): Array<Object> => objs.map(o => {
    return {
        name: o.Prefix.replace(prefix, ''),
        isFolder: true,
        toggled: false,
    };
});

const convertToFormMetadata = (info) => {
    const pairs = systemMetadataKeys.filter(key => info[key]).map(key => {
        return {
            key: key,
            value: info[key],
            type: METADATA_SYSTEM_TYPE,
        };
    });
    for (let key in info.Metadata) {
        pairs.push({
            key: key,
            value: info.Metadata[key],
            type: METADATA_USER_TYPE,
        });
    }
    return pairs;
};

const convertToFormTags = ((tags: TagSet): Tags => tags.map(t => ({ key: t.Key, value: t.Value })));

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
    case 'LIST_OBJECTS_SUCCESS':
        return {
            ...state,
            listObjectsResults: {
                list: List([...folder(action.commonPrefixes, action.prefix), ...objects(action.contents, action.prefix)]),
            },
        };
    case 'TOGGLE_OBJECT':
        return {
            ...state,
            listObjectsResults: {
                list: state.listObjectsResults.list.map(o =>
                    (o.name === action.objectName) ? { ...o, toggled: !o.toggled } : o
                ),
            },
        };
    case 'TOGGLE_ALL_OBJECTS':
        return {
            ...state,
            listObjectsResults: {
                list: state.listObjectsResults.list.map(o =>
                    ({ ...o, toggled: action.toggled })
                ),
            },
        };
    case 'GET_OBJECT_METADATA_SUCCESS':
        return {
            ...state,
            objectMetadata: {
                bucketName: action.bucketName,
                prefixWithSlash: action.prefixWithSlash,
                objectKey: action.objectKey,
                objectName: action.objectKey.replace(action.prefixWithSlash, ''),
                lastModified: action.info.LastModified,
                contentLength: action.info.ContentLength,
                eTag: stripQuotes(action.info.ETag),
                versionId: action.info.VersionId,
                metadata: convertToFormMetadata(action.info),
                tags: convertToFormTags(action.tags),
            },
        };
    case 'RESET_OBJECT_METADATA':
        return {
            ...state,
            objectMetadata: null,
        };
    default:
        return state;
    }
}
