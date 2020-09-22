// @flow
import * as L from '../../ui-elements/ListLayout2';
import React, { useEffect, useState } from 'react';
import { Redirect, useParams } from 'react-router-dom';
import { clearError, listObjects } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { EmptyStateContainer } from '../../ui-elements/Container';
import FolderCreate from './FolderCreate';
import ObjectDetails from './ObjectDetails';
import ObjectHead from './ObjectHead';
import ObjectList from './ObjectList';
import { Warning } from '../../ui-elements/Warning';
import { addTrailingSlash } from '../../utils';
import { push } from 'connected-react-router';

export default function Objects(){
    const dispatch = useDispatch();

    const [ loaded, setLoaded ] = useState(false);

    const objects = useSelector((state: AppState) => state.s3.listObjectsResults.list);
    const hasError = useSelector((state: AppState) => !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent');
    const errorMessage = useSelector((state: AppState) => state.uiErrors.errorMsg);

    const { bucketName: bucketNameParam, '0': prefixParam } = useParams();
    const prefixWithSlash = addTrailingSlash(prefixParam);

    useEffect(() => {
        dispatch(listObjects(bucketNameParam, prefixWithSlash)).then(() => setLoaded(true));
    }, [bucketNameParam, prefixWithSlash, dispatch]);

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
        <FolderCreate bucketName={bucketNameParam} prefixWithSlash={prefixWithSlash}/>
        <ObjectHead bucketNameParam={bucketNameParam}/>

        <L.Body>
            <ObjectList objects={objects} bucketNameParam={bucketNameParam} prefixParam={prefixParam} />
            <ObjectDetails />
        </L.Body>

    </div>;
}
