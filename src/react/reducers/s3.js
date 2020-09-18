// @flow
import { formatBytes, formatDate } from '../utils';
import { List } from 'immutable';
import type { Object } from '../../types/s3';
import type { S3Action } from '../../types/actions';
import type { S3State } from '../../types/state';
import { initialS3State } from './initialConstants';

const sortByDate = objs => objs.sort((a,b) => (new Date(b.CreationDate) - new Date(a.CreationDate)));

const objects = (objs, prefix): Array<Object> => objs.filter(o => o.Key !== prefix).map(o => {
    return {
        name: o.Key.replace(prefix, ''),
        lastModified: formatDate(new Date(o.LastModified)),
        size: formatBytes(o.Size, 0),
        isFolder: false,
    };
});

const folder = (objs, prefix): Array<Object> => objs.map(o => {
    return {
        name: o.Prefix.replace(prefix, ''),
        isFolder: true,
    };
});

export default function s3(state: S3State = initialS3State, action: S3Action) {
    switch (action.type) {
    case 'SET_S3_CLIENT':
        return {
            ...state,
            s3Client: action.s3Client,
        };
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
    default:
        return state;
    }
}
