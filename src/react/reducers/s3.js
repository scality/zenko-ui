// @flow
import { List } from 'immutable';

import type { S3Action } from '../../types/actions';
import type { S3State } from '../../types/state';
import { initialS3State } from './initialConstants';

const sortByDate = objs => objs.sort((a,b) => (new Date(b.CreationDate) - new Date(a.CreationDate)));

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
    default:
        return state;
    }
}
