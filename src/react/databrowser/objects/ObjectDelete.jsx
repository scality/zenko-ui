// @flow
import React, { useMemo } from 'react';
import Table, * as T from '../../ui-elements/Table';
import { closeObjectDeleteModal, deleteFiles, toggleAllObjects } from '../../actions';
import { formatBytes, maybePluralize } from '../../utils';
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../../../types/actions';
import type { AppState } from '../../../types/state';
import { Button } from '@scality/core-ui';
import type { DispatchAPI } from 'redux';
import { List } from 'immutable';
import { CustomModal as Modal } from '../../ui-elements/Modal';
import styled from 'styled-components';

const INFO_DELETE_FOLDER = 'Non-empty folder won\'t be deleted.';

const Files = styled.div`
    height: 250px;
    width: 500px;
    overflow-y: scroll;
    margin: 10px 0px;
    border: 1px solid ${props => props.theme.brand.borderLight};
`;

const title = files => {
    const foldersSize = files.filter(f => f.isFolder).size;
    const objectsSize = files.size - foldersSize;
    return `Do you want to permanently delete the selected ${maybePluralize(objectsSize, 'object')} ` +
    `and ${maybePluralize(foldersSize, 'folder')}?`;
};

const fileSizer = files => {
    const total = files.reduce((accumulator, file) => file.size ? accumulator + file.size : accumulator, 0);
    return formatBytes(total);
};

type Props = {
    toggled: List<Object>,
    prefixWithSlash: string,
    bucketName: string,
};
const ObjectDelete = ({ bucketName, toggled, prefixWithSlash }: Props) => {
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
        const objects = toggled.map(s => {
            return {
                Key: s.key,
                // TODO: add version when implemented.
            };
        }).toArray();
        dispatch(deleteFiles(bucketName, prefixWithSlash, objects));
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
            <div> {title(toggled)} </div>
            <Files>
                <Table>
                    <T.Body>
                        {
                            toggled.map(s => (
                                <T.Row key={s.key}>
                                    <T.Cell> {s.key} <br/>
                                        <small>{s.isFolder ?
                                            <span> <i className='fas fa-info-circle'></i> { INFO_DELETE_FOLDER } </span> :
                                            formatBytes(s.size)}</small>
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
