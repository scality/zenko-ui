import React, {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Table, * as T from '../../ui-elements/Table';
import {
  closeObjectDeleteModal,
  deleteFiles,
  toggleAllObjects,
} from '../../actions';
import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import { Banner } from '@scality/core-ui';
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../../../types/actions';
import type { AppState } from '../../../types/state';
import type { BucketInfo } from '../../../types/s3';
import { Button } from '@scality/core-ui/dist/next';
import type { DispatchAPI } from 'redux';
import { List } from 'immutable';
import { CustomModal as Modal } from '../../ui-elements/Modal';
import { PrettyBytes } from '@scality/core-ui';
import { maybePluralize } from '../../utils';
import { useTheme } from 'styled-components';
import styled from 'styled-components';
import Input from '../../ui-elements/Input';
import { SpacedBox } from '@scality/core-ui/dist/components/spacedbox/SpacedBox';

export const Icon = styled.i`
  display: inline;
  color: ${(props) => props.theme.brand.buttonSecondary};
`;

export const IconSuccess = styled.i`
  color: ${(props) => props.theme.brand.statusHealthy};
`;

const Files = styled.div`
  height: 15.63rem;
  width: 31.25rem;
  overflow-y: scroll;
  margin: ${spacing.sp8} 0rem;
  border: ${spacing.sp1} solid ${(props) => props.theme.brand.border};
`;
const Description = styled.div`
  margin-top: ${spacing.sp4};
`;
const VersionId = styled.div`
  font-size: ${fontSize.small};
  margin-top: ${spacing.sp4};
`;
const ConfirmInput = styled(Input)`
  display: inline;
  width: 3.4375rem;
  margin-left: 0.313rem;
  margin-right: 0.313rem;
`;
const RemoveCell = styled(T.Cell)`
  width: 0.625rem;
`;

const title = (files, isVersioning) => {
  const foldersSize = files.filter((f) => f.isFolder).length;
  const objectsSize = files.length - foldersSize;
  const permanently = isVersioning
    ? files.some((f) => !!f.versionId)
      ? 'permanently'
      : ''
    : 'permanently';
  // return `Do you want to ${permanently} delete the selected ${maybePluralize(objectsSize, 'object')} ` +
  // `and ${maybePluralize(foldersSize, 'folder')}?`;
  return (
    <span>
      {' '}
      Do you want to <strong> {permanently} </strong> delete the selected{' '}
      {maybePluralize(objectsSize, 'object')} and{' '}
      {maybePluralize(foldersSize, 'folder')}?{' '}
    </span>
  );
};

const fileSizer = (files) => {
  const total = files.reduce(
    (accumulator, file) => (file.size ? accumulator + file.size : accumulator),
    0,
  );
  return total;
};

type Props = {
  toggled: List<Record<string, any>>;
  prefixWithSlash: string;
  bucketName: string;
  bucketInfo: BucketInfo;
};

const ConfirmationContext = createContext<{ confirmed: boolean; setConfirmed }>(
  {},
);

function ConfirmationInput({ toggledFiles }) {
  const [inputValue, setInputValue] = useState('');
  const { confirmed, setConfirmed } = useContext(ConfirmationContext);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    target.value === 'confirm' ? setConfirmed(true) : setConfirmed(false);
    setInputValue(target.value);
  };

  return (
    <>
      <ConfirmInput
        id="confirm"
        type="text"
        onChange={handleInputChange}
        disabled={confirmed || toggledFiles.length === 0}
        value={inputValue}
        style={{
          cursor: confirmed || !toggledFiles.length ? 'not-allowed' : 'default',
        }}
      />
      {confirmed && (
        <IconSuccess
          className="fas fa-check"
          style={{ marginLeft: '0.5rem' }}
        />
      )}
    </>
  );
}

const ObjectDelete = ({
  bucketName,
  toggled,
  prefixWithSlash,
  bucketInfo,
}: Props) => {
  const show = useSelector(
    (state: AppState) => state.uiObjects.showObjectDelete,
  );
  const dispatch: DispatchAPI<Action> = useDispatch();

  const [toggledFiles, setToggledFiles] = useState([...toggled]);
  const hasLockedFiles = toggledFiles.some(
    (file) => file.lockStatus === 'LOCKED',
  );
  const totalSize = useMemo(() => fileSizer(toggledFiles), [toggledFiles]);

  const [confirmed, setConfirmed] = useState(false);
  const provided = useMemo(
    () => ({
      confirmed,
      setConfirmed: (confirmed) => setConfirmed(confirmed),
    }),
    [confirmed],
  );
  const theme = useTheme();

  useEffect(() => {
    setToggledFiles([...toggled]);
  }, [toggled]);

  if (!show) {
    return null;
  }

  const cleanFiles = () => {
    setToggledFiles([]);
    setConfirmed(false);
  };

  const cancel = () => {
    cleanFiles();
    dispatch(toggleAllObjects(false));
    dispatch(closeObjectDeleteModal());
  };

  const removeFile = (fileKey: string) => {
    setToggledFiles(toggledFiles.filter((s) => s.key !== fileKey));
  };

  const deleteSelectedFiles = () => {
    if (toggledFiles.length === 0) {
      return;
    }

    const objects = toggledFiles
      .filter((s) => !s.isFolder)
      .map((s) => {
        return {
          Key: s.key,
          VersionId: s.versionId,
        };
      });
    const folders = toggledFiles
      .filter((s) => s.isFolder)
      .map((s) => {
        return {
          Key: s.key,
        };
      });
    dispatch(
      deleteFiles(bucketName, prefixWithSlash, [...objects], [...folders]),
    );
  };

  return (
    <Modal
      id="object-delete"
      close={cancel}
      footer={
        <div>
          <Button
            id="object-delete-cancel-button"
            variant="outline"
            onClick={cancel}
            label="Cancel"
          />
          <Button
            id="object-delete-delete-button"
            disabled={
              toggledFiles.length === 0 || (hasLockedFiles && !confirmed)
            }
            variant="danger"
            onClick={deleteSelectedFiles}
            label="Delete"
          />
        </div>
      }
      isOpen={true}
      title="Confirmation"
    >
      <div> {title(toggledFiles, bucketInfo.isVersioning)} </div>
      <Files>
        <Table>
          <T.Body>
            {toggledFiles.map((s) => (
              <T.Row key={s.key}>
                <T.Cell>
                  {' '}
                  {s.key}
                  <VersionId hidden={!s.versionId}> {s.versionId} </VersionId>
                  <Description>
                    {s.size && <PrettyBytes bytes={s.size} />}
                    {s.lockStatus === 'LOCKED' && (
                      <div
                        style={{
                          color: theme.brand?.textTertiary,
                        }}
                      >
                        <Icon
                          style={{ display: 'inline', marginRight: '0.57rem' }}
                          className="fa fa-lock"
                        ></Icon>
                        {confirmed ? (
                          <span>Protected, will be deleted</span>
                        ) : (
                          <span>Protected, will not be deleted</span>
                        )}
                      </div>
                    )}
                  </Description>
                </T.Cell>
                <RemoveCell>
                  {' '}
                  <div onClick={() => removeFile(s.key)}>
                    {' '}
                    <i className="fas fa-times"></i>{' '}
                  </div>{' '}
                </RemoveCell>
              </T.Row>
            ))}
          </T.Body>
        </Table>
      </Files>
      <SpacedBox mb={12}>
        {' '}
        Total: <PrettyBytes bytes={totalSize} />{' '}
      </SpacedBox>
      {hasLockedFiles && (
        <Fragment>
          <SpacedBox mt={12} mb={12}>
            <Banner
              icon={<i className="fas fa-exclamation-circle" />}
              variant="warning"
            >
              At least one object you want to delete is under <br />
              Object-Lock retention{' '}
              <Icon
                style={{ display: 'inline', margin: '0.063rem' }}
                className="fa fa-lock"
              ></Icon>{' '}
              with governance mode.
            </Banner>
          </SpacedBox>
          <SpacedBox mb={12}>
            {' '}
            <div>
              Protected objects won't be deleted unless you choose to bypass
            </div>
            the governance retention.
          </SpacedBox>
          <SpacedBox mb={8}>
            {' '}
            <span style={{ marginRight: '0.85rem' }}>
              Type "confirm" to bypass governance retention:
            </span>
            <ConfirmationContext.Provider value={provided}>
              <ConfirmationInput toggledFiles={toggledFiles} />
            </ConfirmationContext.Provider>
          </SpacedBox>
        </Fragment>
      )}
    </Modal>
  );
};

export default ObjectDelete;
