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
import type { BucketInfo, ObjectEntity } from '../../../types/s3';
import { Box, Button } from '@scality/core-ui/dist/next';
import type { DispatchAPI } from 'redux';
import { List } from 'immutable';
import { CustomModal as Modal } from '../../ui-elements/Modal';
import { PrettyBytes, Icon } from '@scality/core-ui';
import { maybePluralize } from '../../utils';
import { useTheme } from 'styled-components';
import styled from 'styled-components';
import Input from '../../ui-elements/Input';
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
  toggled: List<ObjectEntity>;
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

export const enum WarningTypes {
  LEGAL_HOLD,
  COMPLIANCE,
  GOVERNANCE,
}

function getWarningBanner(warningType: WarningTypes) {
  if (warningType === WarningTypes.GOVERNANCE) {
    return (
      <Box marginTop={spacing.sp8} marginBottom={spacing.sp8}>
        <Banner icon={<Icon name="Exclamation-circle" />} variant="warning">
          At least one object you want to delete is under Object-Lock retention{' '}
          <Icon name="Lock" color="buttonSecondary" /> with governance mode.
        </Banner>
        <Box marginTop={spacing.sp8}>
          <div>
            Protected versions won't be deleted unless you choose to bypass
          </div>
          the governance retention.
        </Box>
      </Box>
    );
  }
  if (warningType === WarningTypes.COMPLIANCE) {
    return (
      <Box marginTop={spacing.sp8} marginBottom={spacing.sp8}>
        <Banner icon={<Icon name="Exclamation-triangle" />} variant="warning">
          At least one object you want to delete is under Object-Lock retention{' '}
          <Icon name="Lock" color="buttonSecondary" /> with compliance mode.{' '}
          <br />
          Object versions under compliance retention cannot be deleted.
        </Banner>
      </Box>
    );
  }

  if (warningType === WarningTypes.LEGAL_HOLD) {
    return (
      <Box marginTop={spacing.sp8} marginBottom={spacing.sp8}>
        <Banner icon={<Icon name="Exclamation-triangle" />} variant="warning">
          At least one object you want to delete is under Legal Hold{' '}
          <Icon name="Lock" color="buttonSecondary" /> <br />
          Object versions with Legal Hold cannot be deleted.
        </Banner>
      </Box>
    );
  }

  return <></>;
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
}): {
  info: string;
  warnings: WarningTypes[];
  checkboxRequired: boolean;
  confirmationRequired: boolean;
  isDeletionPossible: boolean;
} => {
  if (isBucketVersioned) {
    // default version handling
    if (!selectedObjectsAreSpecificVersions) {
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
          warnings.push(WarningTypes.COMPLIANCE);
        }
        if (objectsLockedInLegalHoldLength > 0) {
          warnings.push(WarningTypes.LEGAL_HOLD);
        }

        return {
          info: '',
          warnings,
          checkboxRequired: false,
          confirmationRequired: false,
          isDeletionPossible: false,
        };
      }

      // can delete with proper access
      if (objectsLockedInGovernanceModeLength > 0) {
        return {
          info: `The selected ${maybePluralize(
            numberOfObjects,
            'version',
            's',
            false,
          )} will be permanently deleted.`,
          warnings: [WarningTypes.GOVERNANCE],
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

  const totalSize = useMemo(() => fileSizer(toggledFiles), [toggledFiles]);

  const [confirmed, setConfirmed] = useState(false);
  const provided = useMemo(() => ({ confirmed, setConfirmed }), [confirmed]);
  const theme = useTheme();
  const [isCheckboxToggled, setIsCheckboxToggled] = useState(false);
  const isCurrentSelectionPermanentlyDeleted = isPermanentDelete(
    toggledFiles,
    bucketInfo.isVersioning,
  );

  const getProtectedDeletionMessage = (s3Object: ObjectEntity) => {
    if (s3Object.lockStatus === 'LOCKED' && s3Object.versionId) {
      if (s3Object.objectRetention?.mode === 'COMPLIANCE') {
        return (
          <Box
            display="flex"
            color={theme.brand?.textTertiary}
            gap={spacing.sp4}
          >
            <Icon color="buttonSecondary" name="Lock" />
            <span>Protected (compliance), won't be deleted</span>
          </Box>
        );
      }
      if (s3Object.objectRetention?.mode === 'GOVERNANCE') {
        return (
          <Box
            display="flex"
            color={theme.brand?.textTertiary}
            gap={spacing.sp4}
          >
            <Icon color="buttonSecondary" name="Lock" />
            <span>Protected (governance), will be deleted</span>
          </Box>
        );
      }
    }
    if (s3Object.isLegalHoldEnabled && s3Object.versionId) {
      return (
        <Box display="flex" color={theme.brand?.textTertiary} gap={spacing.sp4}>
          <Icon color="buttonSecondary" name="Lock" />
          <span>Protected (legal hold), won't be deleted</span>
        </Box>
      );
    }

    return <></>;
  };

  const objectsLockedInComplianceModeLength = toggledFiles.filter(
    (file) =>
      file.lockStatus === 'LOCKED' &&
      file.objectRetention?.mode === 'COMPLIANCE',
  ).length;

  const objectsLockedInGovernanceModeLength = toggledFiles.filter(
    (file) =>
      file.lockStatus === 'LOCKED' &&
      file.objectRetention?.mode === 'GOVERNANCE',
  ).length;

  const objectsLockedInLegalHoldLength = toggledFiles.filter(
    (file) => file.isLegalHoldEnabled,
  ).length;

  const {
    info: notificationText,
    confirmationRequired,
    checkboxRequired,
    warnings,
    isDeletionPossible,
  } = getMessagesAndRequiredActions({
    numberOfObjects: toggled.size,
    selectedObjectsAreSpecificVersions: isCurrentSelectionPermanentlyDeleted,
    isBucketVersioned: bucketInfo.isVersioning,
    objectsLockedInComplianceModeLength,
    objectsLockedInGovernanceModeLength,
    objectsLockedInLegalHoldLength,
  });

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
    setIsCheckboxToggled(false);
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
    setIsCheckboxToggled(false);
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
                !isDeletionPossible ||
                (confirmationRequired && !confirmed) ||
                (checkboxRequired && !isCheckboxToggled)
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
            {toggledFiles.map((toggledFile) => (
              <T.Row key={toggledFile.key}>
                <T.Cell>
                  {' '}
                  {toggledFile.key}
                  <VersionId hidden={!toggledFile.versionId}>
                    {toggledFile.versionId}
                  </VersionId>
                  <Box marginTop={spacing.sp4}>
                    {toggledFile.size &&
                      PrettyBytes({ bytes: toggledFile.size })}
                    {getProtectedDeletionMessage(toggledFile)}
                  </Box>
                </T.Cell>
                <RemoveCell>
                  <div onClick={() => removeFile(toggledFile.key)}>
                    <Icon name="Close" color="buttonSecondary" />
                  </div>
                </RemoveCell>
              </T.Row>
            ))}
          </T.Body>
        </Table>
      </Files>
      <Box mb={spacing.sp12}>Total: {PrettyBytes({ bytes: totalSize })}</Box>
      {toggledFiles.length > 0 && notificationText && (
        <Banner
          variant="base"
          id="notification"
          icon={<Icon name="Info-circle" />}
        >
          <span>{notificationText}</span>
        </Banner>
      )}
      {checkboxRequired && toggledFiles.length > 0 && (
        <CheckboxContainer>
          <Checkbox
            name="confirmingPemanentDeletion"
            id="confirmingPemanentDeletionCheckbox"
            checked={isCheckboxToggled}
            label="Confirm the deletion"
            onChange={() => setIsCheckboxToggled(!isCheckboxToggled)}
          />
        </CheckboxContainer>
      )}
      <Fragment>
        {warnings.length > 0 &&
          warnings.map((warning) => getWarningBanner(warning))}
        {confirmationRequired && (
          <Box marginBottom={spacing.sp8}>
            <span style={{ marginRight: '0.85rem' }}>
              Type "confirm" to bypass governance retention:
            </span>
            <ConfirmationContext.Provider value={provided}>
              <ConfirmationInput toggledFiles={toggledFiles} />
            </ConfirmationContext.Provider>
          </Box>
        )}
      </Fragment>
    </Modal>
  );
};

export default ObjectDelete;
