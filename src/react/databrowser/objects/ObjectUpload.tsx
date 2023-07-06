import { useState } from 'react';
import Table, * as T from '../../ui-elements/Table';
import { closeObjectUploadModal, uploadFiles } from '../../actions';
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../../../types/actions';
import type { AppState } from '../../../types/state';
import { Button } from '@scality/core-ui/dist/next';
import type { DispatchAPI } from 'redux';
import type { File } from '../../../types/s3';
import { CustomModal as Modal } from '../../ui-elements/Modal';
import { Icon, PrettyBytes, Stack, Wrap } from '@scality/core-ui';
import { maybePluralize } from '../../utils';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
import { useDropzone } from 'react-dropzone';
import { usePrefixWithSlash } from '../../utils/hooks';
const DropZone = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;

  height: 300px;
  width: 500px;
  padding: ${spacing.sp20};
  border-width: ${spacing.sp2};
  border-radius: ${spacing.sp2};
  border-color: ${(props) => props.theme.brand.border};
  border-style: dashed;
`;
const RemoveCell = styled(T.Cell)`
  width: 10px;
`;
const Files = styled.div`
  height: 250px;
  overflow-y: scroll;
  margin: ${spacing.sp8} 0px;
`;
const EmptyFile = styled.div`
  text-align: center;
  margin-top: 60px;
  & > * {
    margin-bottom: ${spacing.sp16};
  }
`;

const title = (size) =>
  !size ? 'Upload' : `Upload ${maybePluralize(size, 'file')}`;

type FileListProps = {
  acceptedFiles: Array<File>;
  fileRejections: Array<File>;
  open: () => void;
  removeFile: (arg0: string) => void;
};
// NOTE: If accept, multiple, minSize or maxSize are added to useDropzone parameters,
// files might be rejected (fileRejections) and we will have to show them in <FileList/>.
const FileList = ({ acceptedFiles, open, removeFile }: FileListProps) => (
  <div>
    <Button
      icon={<Icon name="Create-add" />}
      label="Add more files"
      variant="secondary"
      onClick={open}
    />
    <Files>
      <Table>
        <T.Body>
          {acceptedFiles.map((file) => (
            <T.Row key={file.path}>
              <T.Cell>
                {' '}
                <div>
                  {file.path} <br />{' '}
                  <small>
                    <PrettyBytes bytes={file.size} />
                  </small>
                </div>{' '}
              </T.Cell>
              <RemoveCell>
                {' '}
                <div onClick={() => removeFile(file.path)}>
                  {' '}
                  <Icon name="Close" />{' '}
                </div>{' '}
              </RemoveCell>
            </T.Row>
          ))}
        </T.Body>
      </Table>
    </Files>
  </div>
);
type NoFileProps = {
  open: () => void;
};
const NoFile = ({ open }: NoFileProps) => (
  <EmptyFile>
    <Icon name="Upload" size="3x" />
    <div> Drag and drop files and folders here </div>
    <div> OR </div>
    <Button
      icon={<Icon name="Create-add" />}
      label="Add files"
      variant="secondary"
      onClick={open}
    />
  </EmptyFile>
);
type Props = {
  bucketName: string;
};

const ObjectUpload = ({ bucketName }: Props) => {
  const [acceptedFiles, setAcceptedFiles] = useState([]);
  const [fileRejections, setFileRejections] = useState([]);
  const show = useSelector(
    (state: AppState) => state.uiObjects.showObjectUpload,
  );
  const dispatch: DispatchAPI<Action> = useDispatch();
  const prefixWithSlash = usePrefixWithSlash();

  const onDrop = (accepted, rejections) => {
    if (accepted.length > 0) {
      const filtered = accepted.filter(
        (a) => !acceptedFiles.find((f) => f.path === a.path),
      );

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

  const removeFile = (filePath) =>
    setAcceptedFiles(acceptedFiles.filter((f) => f.path !== filePath));

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
        <Wrap>
          <p></p>
          <Stack>
            <Button
              id="object-upload-cancel-button"
              variant="outline"
              onClick={cancel}
              label="Cancel"
            />
            <Button
              id="object-upload-upload-button"
              disabled={acceptedFiles.length === 0}
              variant="secondary"
              onClick={upload}
              label="Upload"
            />
          </Stack>
        </Wrap>
      }
      isOpen={true}
      title={title(acceptedFiles.length)}
    >
      <DropZone {...getRootProps()}>
        <input className="object-upload-drop-zone-input" {...getInputProps()} />
        {acceptedFiles.length > 0 || fileRejections.length > 0 ? (
          <FileList
            acceptedFiles={acceptedFiles}
            fileRejections={fileRejections}
            open={open}
            removeFile={removeFile}
          />
        ) : (
          <NoFile open={open} />
        )}
      </DropZone>
    </Modal>
  );
};

export default ObjectUpload;
