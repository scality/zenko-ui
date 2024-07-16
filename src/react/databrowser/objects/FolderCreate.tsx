import { InfoMessage, Stack, Wrap } from '@scality/core-ui';
import { Button, Input } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { ChangeEvent, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { AppState } from '../../../types/state';
import { closeFolderCreateModal, createFolder } from '../../actions';
import { CustomModal as Modal } from '../../ui-elements/Modal';
import { addTrailingSlash } from '../../utils';
export const Description = styled.div`
  margin-top: ${spacing.sp16};
  width: 20.5rem;
`;

type Props = {
  bucketName: string;
  prefixWithSlash: string;
};

const FolderCreate = ({ bucketName, prefixWithSlash }: Props) => {
  const [folderName, setFolderName] = useState('');
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );
  const show = useSelector(
    (state: AppState) => state.uiObjects.showFolderCreate,
  );
  const dispatch = useDispatch();

  if (!show) {
    return null;
  }

  const cancel = () => {
    setFolderName('');
    dispatch(closeFolderCreateModal());
  };

  const save = () => {
    if (!folderName) {
      return;
    }

    setFolderName('');
    dispatch(
      createFolder(bucketName, prefixWithSlash, addTrailingSlash(folderName)),
    );
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFolderName(e.target.value);
  };

  return (
    <Modal
      close={cancel}
      footer={
        <Wrap>
          <p></p>
          <Stack>
            <Button
              id="folder-create-cancel-button"
              variant="outline"
              disabled={loading}
              onClick={cancel}
              label="Cancel"
            />
            <Button
              id="folder-create-save-button"
              disabled={loading || !folderName}
              variant="secondary"
              onClick={save}
              label="Save"
            />
          </Stack>
        </Wrap>
      }
      isOpen={true}
      title="Create a folder"
    >
      <Input
        id="folder-create-input"
        className="folder-create-input"
        value={folderName}
        placeholder="New folder"
        ref={(input) => {
          if (input) {
            setTimeout(() => input.focus());
          }
        }}
        onChange={handleChange}
      />
      <Description>
        <InfoMessage
          title="Creating a folder"
          content='When you create a folder, Data Browser creates an object with the
          above name appended by suffix "/" and that object is
          displayed as a folder in the Data Browser.'
        />
      </Description>
    </Modal>
  );
};

export default FolderCreate;
