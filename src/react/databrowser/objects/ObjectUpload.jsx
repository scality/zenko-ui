// @flow
import React, { useState } from 'react';
import Table, * as T from '../../ui-elements/Table';
import { closeObjectUploadModal, uploadFiles } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../../../types/actions';
import type { AppState } from '../../../types/state';
import { Button } from '@scality/core-ui';
import type { DispatchAPI } from 'redux';
import type { File } from '../../../types/s3';
import { CustomModal as Modal } from '../../ui-elements/Modal';
import { formatBytes } from '../../utils';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';

const DropZone = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;

    height: 300px;
    width: 500px;
    padding: 20px;
    border-width: 2px;
    border-radius: 2px;
    border-color: ${props => props.theme.brand.borderLight};
    border-style: dashed;
`;

const RemoveCell = styled(T.Cell)`
    width: 10px;
`;

const Files = styled.div`
    height: 250px;
    overflow-y: scroll;
    margin: 10px 0px;
`;

const EmptyFile = styled.div`
    text-align: center;
    margin-top: 60px;
    & > * {
        margin-bottom: 15px;
    }
`;

const title = size => !size ? 'Upload' : `Upload ${size} file${size > 1 ? 's': ''}`;

type FileListProps = {
    acceptedFiles: Array<File>,
    fileRejections: Array<File>,
    open: () => void,
    removeFile: (string) => void,
};
// NOTE: If accept, multiple, minSize or maxSize are added to useDropzone parameters,
// files might be rejected (fileRejections) and we will have to show them in <FileList/>.
const FileList = ({ acceptedFiles, open, removeFile }: FileListProps) =>
    <div>
        <Button icon={<i className="fas fa-plus" />} size='small' text='Add more files' variant='info' onClick={open} />
        <Files>
            <Table>
                <T.Body>
                    {
                        acceptedFiles.map(file => (
                            <T.Row key={file.path}>
                                <T.Cell> {file.path} <br/> <small>{formatBytes(file.size)}</small> </T.Cell>
                                <RemoveCell> <div onClick={() => removeFile(file.path)}> <i className='fas fa-times'></i> </div> </RemoveCell>
                            </T.Row>
                        ))
                    }
                </T.Body>
            </Table>
        </Files>
    </div>;

type NoFileProps = {
    open: () => void,
};
const NoFile = ({ open }: NoFileProps) =>
    <EmptyFile>
        <i className="fas fa-3x fa-file-upload"></i>
        <div> Drag and drop files and folders here </div>
        <div> OR </div>
        <Button icon={<i className="fas fa-plus" />} text='Add files' variant='info' onClick={open} />
    </EmptyFile>;

type Props = {
    bucketName: string,
    prefixWithSlash: string,
};
const ObjectUpload = ({ bucketName, prefixWithSlash }: Props) => {
    const [acceptedFiles, setAcceptedFiles] = useState([]);
    const [fileRejections, setFileRejections] = useState([]);
    const show = useSelector((state: AppState) => state.uiObjects.showObjectUpload);
    const dispatch: DispatchAPI<Action> = useDispatch();

    const onDrop = (accepted, rejections) => {
        if (accepted.length > 0) {
            const filtered = accepted.filter(a => !acceptedFiles.find(f => f.path === a.path));
            if (filtered.length > 0) {
                setAcceptedFiles([...acceptedFiles, ...filtered]);
            }
        }
        if (rejections.length > 0) {
            setFileRejections([...fileRejections, ...rejections]);
        }
    };

    const { getRootProps, getInputProps, open } = useDropzone({
        noClick: true,
        noKeyboard: true,
        onDrop,
    });

    const cleanFiles = () => {
        setAcceptedFiles([]);
        setFileRejections([]);
    };

    const cancel = () => {
        cleanFiles();
        dispatch(closeObjectUploadModal());
    };

    const removeFile = filePath => setAcceptedFiles(acceptedFiles.filter(f => f.path !== filePath));

    const upload = () => {
        cleanFiles();
        dispatch(uploadFiles(bucketName, prefixWithSlash, acceptedFiles));
    };

    if (!show) {
        return null;
    }

    return (
        <Modal
            id="object-upload"
            close={cancel}
            footer={
                <div>
                    <Button outlined onClick={cancel} size='small' text='Cancel'/>
                    <Button disabled={acceptedFiles.length === 0} variant='info' onClick={upload} size="small" text='Uplaod'/>
                </div>
            }
            isOpen={true}
            title={title(acceptedFiles.length)}>
            <DropZone {...getRootProps()}>
                <input {...getInputProps()} />
                { acceptedFiles.length > 0 || fileRejections.length > 0 ?
                    <FileList acceptedFiles={acceptedFiles} fileRejections={fileRejections} open={open} removeFile={removeFile}/> :
                    <NoFile open={open}/>
                }
            </DropZone>
        </Modal>
    );
};

export default ObjectUpload;
