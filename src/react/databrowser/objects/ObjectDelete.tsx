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
import { Banner, Stack, Wrap } from '@scality/core-ui';
import { useDispatch, useSelector } from 'react-redux';
import type { Action } from '../../../types/actions';
import type { AppState } from '../../../types/state';
import type { BucketInfo } from '../../../types/s3';
import { Box, Button } from '@scality/core-ui/dist/next';
import type { DispatchAPI } from 'redux';
import { List } from 'immutable';
import { CustomModal as Modal } from '../../ui-elements/Modal';
import { PrettyBytes, Icon } from '@scality/core-ui';
import { maybePluralize } from '../../utils';
import { useTheme } from 'styled-components';
import styled from 'styled-components';
import Input from '../../ui-elements/Input';
import { SpacedBox } from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import { Checkbox, CheckboxContainer } from '../../ui-elements/FormLayout';

const Files = styled.div`
  height: 15.63rem;
  width: 31.25rem;
  overflow-y: scroll;
  margin: ${spacing.sp8} 0rem;
  border: ${spacing.sp1} solid ${(props) => props.theme.brand.border};
`;
const VersionId = styled.div`
  font-size: ${fontSize.small};
  margin-top: ${spacing.sp4};
`;
const ConfirmInput = styled(Input)`
  width: 3.4375rem;
  margin-left: 0.313rem;
  margin-right: 0.313rem;
`;
const RemoveCell = styled(T.Cell)`
  width: 0.625rem;
`;

const isPermanentDelete = (
  files: Record<string, any>[],
  isVersioningBucket: boolean,
): boolean =>
  isVersioningBucket ? (files.some((f) => !!f.versionId) ? true : false) : true;

const title = (files: Record<string, any>[], isVersioning: boolean) => {
  const foldersSize = files.filter((f) => f.isFolder).length;
  const objectsSize = files.length - foldersSize;
  const isCurrentSelectionPermanentlyDeleted = isPermanentDelete(
    files,
    isVersioning,
  );

  // return `Do you want to ${permanently} delete the selected ${maybePluralize(objectsSize, 'object')} ` +
  // `and ${maybePluralize(foldersSize, 'folder')}?`;
  return (
    <span>
      {' '}
      Do you want to{' '}
      <strong>
        {' '}
        {isCurrentSelectionPermanentlyDeleted ? 'permanently' : ''}{' '}
      </strong>{' '}
      delete the selected{' '}
      {isCurrentSelectionPermanentlyDeleted
        ? maybePluralize(objectsSize, 'object version')
        : maybePluralize(objectsSize, 'object')}{' '}
      and {maybePluralize(foldersSize, 'folder')}?{' '}
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

const ConfirmationContext = createContext<{
  confirmed: boolean;
  setConfirmed: (value: boolean) => void;
}>({} as any);

function ConfirmationInput({ toggledFiles }: { toggledFiles: unknown[] }) {
  const [inputValue, setInputValue] = useState('');
  const { confirmed, setConfirmed } = useContext(ConfirmationContext);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    target.value === 'confirm' ? setConfirmed(true) : setConfirmed(false);
    setInputValue(target.value);
  };

  const cursor = confirmed || !toggledFiles.length ? 'not-allowed' : 'default';

  return (
    <Stack direction="horizontal" gap="r8">
      <ConfirmInput
        id="confirm"
        type="text"
        onChange={handleInputChange}
        disabled={confirmed || toggledFiles.length === 0}
        value={inputValue}
        style={{ cursor }}
      />
      {confirmed && <Icon name="Check" color="statusHealthy" />}
    </Stack>
  );
}

export const getMessagesAndRequiredActions = ({
  numberOfObjects,
  selectedObjectsAreSpecificVersions,
  isBucketVersioned,
  objectsLockedInComplianceModeLength,
  objectsLockedInGovernanceModeLength,
  objectsLockedInLegalHoldLength,
}: {
  numberOfObjects: number;
  selectedObjectsAreSpecificVersions: boolean;
  isBucketVersioned: boolean;
  objectsLockedInComplianceModeLength: number;
  objectsLockedInGovernanceModeLength: number;
  objectsLockedInLegalHoldLength: number;
}) => {
  if (isBucketVersioned) {
    // default version handling
    if (!selectedObjectsAreSpecificVersions) {
      // it would seem that the checks for governance and compliance mode are unnecessary, as both return the same object (at least according to the excel sheet)
      // if (objectsLockedInGovernanceModeLength > 0) {
      //   return {
      //     info: `Delete ${maybePluralize(
      //       numberOfObjects,
      //       'marker',
      //       's',
      //       false,
      //     )} will be added to the ${maybePluralize(
      //       numberOfObjects,
      //       'object',
      //       's',
      //       false,
      //     )}.`,
      //     warnings: [],
      //     checkboxRequired: false,
      //     confirmationRequired: false,
      //     isDeletionPossible: true,
      //   };
      // }

      // if (objectsLockedInComplianceModeLength > 0) {
      //   return {
      //     info: `Delete ${maybePluralize(
      //       numberOfObjects,
      //       'marker',
      //       's',
      //       false,
      //     )} will be added to the ${maybePluralize(
      //       numberOfObjects,
      //       'object',
      //       's',
      //       false,
      //     )}.`,
      //     warnings: [],
      //     checkboxRequired: false,
      //     confirmationRequired: false,
      //     isDeletionPossible: true,
      //   };
      // }

      return {
        info: `Delete ${maybePluralize(
          numberOfObjects,
          'marker',
          's',
          false,
        )} will be added to the ${maybePluralize(
          numberOfObjects,
          'object',
          's',
          false,
        )}.`,
        warnings: [],
        checkboxRequired: false,
        confirmationRequired: false,
        isDeletionPossible: true,
      };
    }
    // specific version handling
    else {
      // can't delete, return early
      if (
        objectsLockedInComplianceModeLength > 0 ||
        objectsLockedInLegalHoldLength > 0
      ) {
        const warnings = [];

        if (objectsLockedInComplianceModeLength > 0) {
          warnings.push("Protected (compliance), won't be deleted");
        }
        if (objectsLockedInLegalHoldLength > 0) {
          warnings.push("Protected (legal hold), won't be deleted");
        }

        return {
          info: 'Warning: Object versions under compliance retention or legal hold cannot be deleted.',
          warnings,
          checkboxRequired: false,
          confirmationRequired: false,
          isDeletionPossible: false,
        };
      }

      // can delete with proper access
      if (objectsLockedInGovernanceModeLength > 0) {
        return {
          info: "Warning: Protected versions won't be deleted unless you choose to bypass the governance retention.",
          warnings: ['Protected (governance), will be deleted'],
          checkboxRequired: false,
          confirmationRequired: true,
          isDeletionPossible: true,
        };
      }

      // can delete with checkbox
      return {
        info: `The selected ${maybePluralize(
          numberOfObjects,
          'version',
          's',
          false,
        )} will be permanently deleted.`,
        warnings: [],
        checkboxRequired: true,
        confirmationRequired: false,
        isDeletionPossible: true,
      };
    }
  }

  // non-versioned-bucket
  return {
    info: `The selected ${maybePluralize(
      numberOfObjects,
      'object',
      's',
      false,
    )} will be permanently deleted.`,
    warnings: [],
    checkboxRequired: true,
    confirmationRequired: false,
    isDeletionPossible: true,
  };
};

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
  const provided = useMemo(() => ({ confirmed, setConfirmed }), [confirmed]);
  const theme = useTheme();
  const [isVersionDeletionConfirmed, setIsVersionDeletionConfirmed] =
    useState(false);
  const isCurrentSelectionPermanentlyDeleted = isPermanentDelete(
    toggledFiles,
    bucketInfo.isVersioning,
  );
  const markersStr = maybePluralize(toggled.size, 'marker', 's', false);
  const objectsStr = maybePluralize(toggled.size, 'object', 's', false);
  const versionsStr = maybePluralize(toggled.size, 'version', 's', false);
  const notificationText = !isCurrentSelectionPermanentlyDeleted
    ? `Delete ${markersStr} will be added to the selected ${objectsStr}.`
    : `The selected ${versionsStr} will be permanently deleted from the Bucket.`;
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
    setIsVersionDeletionConfirmed(false);
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
    setIsVersionDeletionConfirmed(false);
  };

  return (
    <Modal
      id="object-delete"
      close={cancel}
      footer={
        <Wrap>
          <p></p>
          <Stack>
            <Button
              id="object-delete-cancel-button"
              variant="outline"
              onClick={cancel}
              label="Cancel"
            />
            <Button
              id="object-delete-delete-button"
              disabled={
                toggledFiles.length === 0 ||
                (hasLockedFiles && !confirmed) ||
                (isCurrentSelectionPermanentlyDeleted &&
                  !isVersionDeletionConfirmed &&
                  !hasLockedFiles)
              }
              variant="danger"
              onClick={deleteSelectedFiles}
              label="Delete"
            />
          </Stack>
        </Wrap>
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
                  <Box marginTop={spacing.sp4}>
                    {s.size && <PrettyBytes bytes={s.size} />}
                    {s.lockStatus === 'LOCKED' && (
                      <Box
                        display="flex"
                        color={theme.brand?.textTertiary}
                        gap={spacing.sp4}
                      >
                        <Icon color="buttonSecondary" name="Lock" />
                        <span>
                          {confirmed
                            ? 'Protected, will be deleted'
                            : 'Protected, will not be deleted'}
                        </span>
                      </Box>
                    )}
                  </Box>
                </T.Cell>
                <RemoveCell>
                  <div onClick={() => removeFile(s.key)}>
                    <Icon name="Close" color="buttonSecondary" />
                  </div>
                </RemoveCell>
              </T.Row>
            ))}
          </T.Body>
        </Table>
      </Files>
      <SpacedBox mb={12}>
        Total: <PrettyBytes bytes={totalSize} />
      </SpacedBox>
      {toggledFiles.length > 0 && (
        <Banner
          variant="base"
          id="notification"
          icon={<Icon name="Info-circle" />}
        >
          <span>{notificationText}</span>
        </Banner>
      )}
      {isCurrentSelectionPermanentlyDeleted &&
        !hasLockedFiles &&
        toggledFiles.length > 0 && (
          <CheckboxContainer>
            <Checkbox
              name="confirmingPemanentDeletion"
              id="confirmingPemanentDeletionCheckbox"
              checked={isVersionDeletionConfirmed}
              label="Confirm the deletion"
              onChange={() =>
                setIsVersionDeletionConfirmed(!isVersionDeletionConfirmed)
              }
            />
          </CheckboxContainer>
        )}
      {hasLockedFiles && (
        <Fragment>
          <SpacedBox mt={12} mb={12}>
            <Banner icon={<Icon name="Exclamation-circle" />} variant="warning">
              At least one object you want to delete is under <br />
              Object-Lock retention <Icon
                name="Lock"
                color="buttonSecondary"
              />{' '}
              with governance mode.
            </Banner>
          </SpacedBox>
          <SpacedBox mb={12}>
            <div>
              Protected objects won't be deleted unless you choose to bypass
            </div>
            the governance retention.
          </SpacedBox>
          <SpacedBox mb={8}>
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
