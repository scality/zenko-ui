// @flow
import { List } from 'immutable';
import type { Object } from '../../types/s3';
import type { S3Action } from '../../types/actions';
import type { S3State } from '../../types/state';
import { formatDate } from '../utils';
import { initialS3State } from './initialConstants';

const sortByDate = objs => objs.sort((a,b) => (new Date(b.CreationDate) - new Date(a.CreationDate)));

const objects = (objs, prefix): Array<Object> => objs.filter(o => o.Key !== prefix).map(o => {
    return {
        name: o.Key.replace(prefix, ''),
        lastModified: formatDate(new Date(o.LastModified)),
        size: o.Size,
        isFolder: false,
        toggled: false,
    };
});

const folder = (objs, prefix): Array<Object> => objs.map(o => {
    return {
        name: o.Prefix.replace(prefix, ''),
        isFolder: true,
        toggled: false,
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
    default:
        return state;
    }
}
