// @flow

import * as L from '../../ui-elements/ListLayout2';
import * as T from '../../ui-elements/Table';
import { LIST_OBJECTS_METADATA_TYPE, maybePluralize } from '../../utils';
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

export default function ObjectList({ objects, bucketName, prefixWithSlash, toggled }: Props){
    const dispatch = useDispatch();
    const errorZenkoMsg = useSelector((state: AppState) => state.zenko.error.message);
    const listType = useSelector((state: AppState) => state.s3.listObjectsType);
    const isMetadataType = listType === LIST_OBJECTS_METADATA_TYPE;

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
        return <ObjectListTable objects={objects} bucketName={bucketName} toggled={toggled} />;
    };
    return <L.ListSection>
        <ObjectDelete bucketName={bucketName} toggled={toggled} prefixWithSlash={prefixWithSlash}/>
        <T.HeaderContainer>
            <MetadataSearch errorZenkoMsg={errorZenkoMsg} isMetadataType={isMetadataType} bucketName={bucketName} prefixWithSlash={prefixWithSlash} />
            <T.ButtonContainer>
                <T.ExtraButton id='object-list-upload-button' text='Upload' icon={<i className="fas fa-upload" />} variant='info' onClick={() => dispatch(openObjectUploadModal())} size="default" />
                <T.ExtraButton id='object-list-create-folder-button' text='Create Folder' icon={<i className="fas fa-plus" />} variant='info' onClick={() => dispatch(openFolderCreateModal())} size="default" />
                <T.ExtraButton id='object-list-delete-button' text='Delete' icon={<i className="fas fa-trash" />} disabled={isToggledEmpty} variant='danger' onClick={() => dispatch(openObjectDeleteModal())} size="default" />
            </T.ButtonContainer>
        </T.HeaderContainer>
        <T.SubHeaderContainer isHidden={!isMetadataType || !!errorZenkoMsg ? 1 : 0}> {maybePluralize(objects.size, 'metadata search result')} </T.SubHeaderContainer>
        { maybeListTable() }
    </L.ListSection>;
}
