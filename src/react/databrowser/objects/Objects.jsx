// @flow
import * as L from '../../ui-elements/ListLayout2';
import React, { useEffect, useMemo, useState } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { clearError, getObjectMetadata, listObjects, resetObjectMetadata } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { EmptyStateContainer } from '../../ui-elements/Container';
import FolderCreate from './FolderCreate';
import ObjectDetails from './ObjectDetails';
import ObjectHead from './ObjectHead';
import ObjectList from './ObjectList';
import ObjectUpload from './ObjectUpload';
import { Warning } from '../../ui-elements/Warning';
import { addTrailingSlash } from '../../utils';
import { push } from 'connected-react-router';

export default function Objects(){
    const dispatch = useDispatch();

    const [ loaded, setLoaded ] = useState(false);

    const objects = useSelector((state: AppState) => state.s3.listObjectsResults.list);
    const hasError = useSelector((state: AppState) => !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent');
    const errorMessage = useSelector((state: AppState) => state.uiErrors.errorMsg);
    const listType = useSelector((state: AppState) => state.s3.listObjectsType);

    const toggled = useMemo(() => objects.filter(o => o.toggled), [objects]);

    const { bucketName: bucketNameParam, '0': prefixParam } = useParams();
    const prefixWithSlash = addTrailingSlash(prefixParam);

    useEffect(() => {
        dispatch(listObjects(bucketNameParam, prefixWithSlash)).finally(() => setLoaded(true));
    }, [bucketNameParam, prefixWithSlash, dispatch]);

    // NOTE: If only one unique object (not folder) is selected, we show its metadata.
    //       Otherwise, we clear object metadata.
    useEffect(() => {
        const firstToggledItem = toggled.first();
        if (toggled.size === 1 && !firstToggledItem.isFolder && !firstToggledItem.isDeleteMarker) {
            dispatch(getObjectMetadata(bucketNameParam, firstToggledItem.key, firstToggledItem.versionId));
        } else {
            dispatch(resetObjectMetadata());
        }
    }, [dispatch, bucketNameParam, toggled]);

    if (!loaded) {
        return <ObjectHead/>;
    }

    if (!bucketNameParam) {
        return <Redirect to={'/buckets'}/>;
    }

    if (hasError) {
        return <EmptyStateContainer>
            <Warning
                iconClass="fas fa-5x fa-exclamation-triangle"
                title={errorMessage || 'An unexpected error has occurred.'}
                btnTitle='Display buckets'
                btnAction={() => { dispatch(clearError()); dispatch(push('/buckets')); }} />
        </EmptyStateContainer>;
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

    return <div>
        <ObjectUpload bucketName={bucketNameParam} prefixWithSlash={prefixWithSlash}/>
        <FolderCreate bucketName={bucketNameParam} prefixWithSlash={prefixWithSlash}/>
        <ObjectHead bucketNameParam={bucketNameParam}/>

        <L.Body>
            <ObjectList toggled={toggled} objects={objects} bucketName={bucketNameParam} prefixWithSlash={prefixWithSlash} listType={listType} />
            <ObjectDetails toggled={toggled} listType={listType} />
        </L.Body>

    </div>;
}
