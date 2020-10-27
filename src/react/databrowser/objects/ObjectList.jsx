// @flow

import * as L from '../../ui-elements/ListLayout2';
import * as T from '../../ui-elements/Table';
import React, { useEffect } from 'react';
import { getObjectMetadata, openFolderCreateModal, openObjectDeleteModal, openObjectUploadModal, resetObjectMetadata } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../../types/state';
import { List } from 'immutable';
import MetadataSearch from './MetadataSearch';
import type { Object } from '../../../types/s3';
import ObjectDelete from './ObjectDelete';
import ObjectListTable from './ObjectListTable';
import { WarningMetadata } from '../../ui-elements/Warning';

type Props = {
    objects: List<Object>,
    bucketName: string,
    prefixWithSlash: string,
    toggled: List<Object>,
};
export default function ObjectList({ objects, bucketName, prefixWithSlash, toggled, q }: Props){
    const errorZenkoMsg = useSelector((state: AppState) => state.zenko.error.message);
    const dispatch = useDispatch();

    const isToggledEmpty = toggled.size === 0;
    // NOTE: If only one unique object (not folder) is selected, we show its metadata.
    //       Otherwise, we clear object metadata.
    useEffect(() => {
        const firstToggledItem = toggled.first();
        if (toggled.size === 1 && !firstToggledItem.isFolder) {
            dispatch(getObjectMetadata(bucketName, prefixWithSlash, `${firstToggledItem.key}`));
        } else {
            dispatch(resetObjectMetadata());
        }
    }, [dispatch, bucketName, toggled, prefixWithSlash]);

    const maybeListTable = () => {
        if (errorZenkoMsg) {
            return <WarningMetadata iconClass='fas fa-2x fa-info-circle' description={errorZenkoMsg} />;
        }
        return <ObjectListTable objects={objects} bucketName={bucketName} prefixWithSlash={prefixWithSlash} toggled={toggled} />;
    };

    return <L.ListSection>
        <ObjectDelete bucketName={bucketName} toggled={toggled} prefixWithSlash={prefixWithSlash}/>
        <T.ButtonContainer>
            <T.ExtraButton id='object-list-upload-button' icon={<i className="fas fa-upload" />} text="Upload" variant='info' onClick={() => dispatch(openObjectUploadModal())} size="default" />
            <T.ExtraButton id='object-list-create-folder-button' icon={<i className="fas fa-plus" />} text="Create folder" variant='info' onClick={() => dispatch(openFolderCreateModal())} size="default" />
            <T.ExtraButton id='object-list-delete-button' style={{ marginLeft: 'auto' }} icon={<i className="fas fa-trash" />} disabled={isToggledEmpty} text="Delete" variant='danger' onClick={() => dispatch(openObjectDeleteModal())} size="default" />
        </T.ButtonContainer>
        <MetadataSearch q={q} bucketName={bucketName} prefixWithSlash={prefixWithSlash} />
        { maybeListTable() }
    </L.ListSection>;
}
