// @flow
import React, { useMemo } from 'react';
import Table, * as T from '../../ui-elements/Table';
import { closeObjectDeleteModal, deleteFiles, toggleAllObjects } from '../../actions';
import { formatBytes, maybePluralize } from '../../utils';
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../../../types/actions';
import type { AppState } from '../../../types/state';
import type { BucketInfo } from '../../../types/s3';
import { Button } from '@scality/core-ui';
import type { DispatchAPI } from 'redux';
import { List } from 'immutable';
import { CustomModal as Modal } from '../../ui-elements/Modal';
import styled from 'styled-components';

const Files = styled.div`
    height: 250px;
    width: 500px;
    overflow-y: scroll;
    margin: 10px 0px;
    border: 1px solid ${props => props.theme.brand.borderLight};
`;

const Description = styled.div`
    font-size: 14px;
    margin-top: 2px;
`;

const VersionId = styled.div`
    font-size: 11px;
    margin-top: 2px;
`;

const title = (files, isVersioning) => {
    const foldersSize = files.filter(f => f.isFolder).size;
    const objectsSize = files.size - foldersSize;
    const permanently = isVersioning ? files.some(f => !!f.versionId) ? 'permanently' : '' : 'permanently';
    // return `Do you want to ${permanently} delete the selected ${maybePluralize(objectsSize, 'object')} ` +
    // `and ${maybePluralize(foldersSize, 'folder')}?`;
    return <span> Do you want to <strong> {permanently} </strong> delete the selected { maybePluralize(objectsSize, 'object') } and { maybePluralize(foldersSize, 'folder') }? </span>;
};

const fileSizer = files => {
    const total = files.reduce((accumulator, file) => file.size ? accumulator + file.size : accumulator, 0);
    return formatBytes(total);
};

type Props = {
    toggled: List<Object>,
    prefixWithSlash: string,
    bucketName: string,
    bucketInfo: BucketInfo,
};
const ObjectDelete = ({ bucketName, toggled, prefixWithSlash, bucketInfo }: Props) => {
    const show = useSelector((state: AppState) => state.uiObjects.showObjectDelete);
    const totalSize = useMemo(() => fileSizer(toggled), [toggled]);
    const dispatch: DispatchAPI<Action> = useDispatch();

    if (!show) {
        return null;
    }

    const cancel = () => {
        dispatch(toggleAllObjects(false));
        dispatch(closeObjectDeleteModal());
    };

    const deleteSelectedFiles = () => {
        if (toggled.size === 0) {
            return;
        }
        const objects = toggled.filter(s => !s.isFolder).map(s => {
            return {
                Key: s.key,
                VersionId: s.versionId,
            };
        }).toArray();
        const folders = toggled.filter(s => s.isFolder).map(s => {
            return {
                Key: s.key,
            };
        }).toArray();
        dispatch(deleteFiles(bucketName, prefixWithSlash, objects, folders));
    };

    return (
        <Modal
            id="object-delete"
            close={cancel}
            footer={
                <div>
                    <Button id='object-delete-cancel-button' outlined onClick={cancel} size='small' text='Cancel'/>
                    <Button id='object-delete-delete-button' disabled={toggled.size === 0} variant='danger' onClick={deleteSelectedFiles} size="small" text='Delete'/>
                </div>
            }
            isOpen={true}
            title='Confirmation'>
            <div> {title(toggled, bucketInfo.isVersioning)} </div>
            <Files>
                <Table>
                    <T.Body>
                        {
                            toggled.map(s => (
                                <T.Row key={s.key}>
                                    <T.Cell> {s.key}
                                        <VersionId hidden={!s.versionId}> {s.versionId} </VersionId>
                                        <Description>
                                            {s.size && formatBytes(s.size)}
                                        </Description>
                                    </T.Cell>
                                </T.Row>
                            ))
                        }
                    </T.Body>
                </Table>
            </Files>
            <div> Total: {totalSize} </div>
        </Modal>
    );
};

export default ObjectDelete;
