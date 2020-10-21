// @flow
import { LIST_OBJECTS_METADATA_TYPE, LIST_OBJECTS_S3_TYPE, formatDate, stripQuotes } from '../utils';
import type { MetadataItems, MetadataPairs, Object, TagSet, Tags } from '../../types/s3';
import { List } from 'immutable';
import type { S3Action } from '../../types/actions';
import type { S3State } from '../../types/state';
import { initialS3State } from './initialConstants';

const sortByDate = objs => objs.sort((a,b) => (new Date(b.CreationDate) - new Date(a.CreationDate)));

const objects = (objs, prefix): Array<Object> => objs.filter(o => o.Key !== prefix).map(o => {
    return {
        name: o.Key.replace(prefix, ''),
        key: o.Key,
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
        key: o.Prefix,
        isFolder: true,
        toggled: false,
    };
});

const search = (objs): Array<Object> => objs.map(o => {
    return {
        name: o.Key,
        key: o.Key,
        lastModified: formatDate(new Date(o.LastModified)),
        size: o.Size,
        isFolder: o.IsFolder,
        signedUrl: o.SignedUrl,
    };
});

const convertToFormMetadata = (obj: MetadataPairs): MetadataItems => {
    const pairs = [];
    for (let key in obj) {
        if (key.toLowerCase().startsWith('x-amz-meta')) {
            pairs.push({
                key: 'x-amz-meta',
                metaKey: key.substring(11),
                value: obj[key],
            });
        } else {
            pairs.push({
                key,
                value: obj[key],
            });
        }
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
            listObjectsType: LIST_OBJECTS_S3_TYPE,
            listObjectsResults: {
                list: List([...folder(action.commonPrefixes, action.prefix), ...objects(action.contents, action.prefix)]),
            },
        };
    case 'ZENKO_CLIENT_WRITE_SEARCH_LIST':
        return {
            ...state,
            listObjectsType: LIST_OBJECTS_METADATA_TYPE,
            listObjectsResults: {
                list: List(search(action.list)),
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
                contentType: action.info.ContentType,
                eTag: stripQuotes(action.info.ETag),
                versionId: action.info.VersionId,
                metadata: convertToFormMetadata(action.info.Metadata),
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
