import * as s3object from '../../../actions/s3object';
import {
  BUCKET_NAME,
  S3_OBJECT,
} from '../../../actions/__tests__/utils/testUtil';
import { BUCKET_INFO } from './utils/testUtil';
import { List } from 'immutable';
import ObjectDelete, {
  getMessagesAndRequiredActions,
  WarningTypes,
} from '../ObjectDelete';
import React from 'react';
import { reduxMount, renderWithRouterMatch } from '../../../utils/testUtil';
import { act } from 'react-dom/test-utils';
import { screen, waitFor } from '@testing-library/react';
import { debug } from 'jest-preview';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const s3ObjectToDelete = {
  key: S3_OBJECT.Key,
  versionId: 'v1',
};

const server = setupServer();

describe('ObjectDelete', () => {
  beforeEach(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should render ObjectDelete component', () => {
    renderWithRouterMatch(
      <ObjectDelete
        bucketName={BUCKET_NAME}
        toggled={[s3ObjectToDelete]}
        bucketInfo={BUCKET_INFO}
        prefixWithSlash=""
      />,
      undefined,
      {
        uiObjects: {
          showObjectDelete: true,
        },
      },
    );

    expect(screen.getByText('Confirmation')).toBeInTheDocument();
  });
  it('should render an empty ObjectDelete component if showObjectDelete equals to false', () => {
    renderWithRouterMatch(
      <ObjectDelete
        bucketName={BUCKET_NAME}
        toggled={List([s3ObjectToDelete])}
        bucketInfo={BUCKET_INFO}
        prefixWithSlash=""
      />,
      undefined,
      {
        uiObjects: {
          showObjectDelete: false,
        },
      },
    );
    expect(screen.queryByText('Confirmation')).toBeNull();
  });

  it('should call closeObjectDeleteModal and toggleAllObjects if cancel button is pressed', () => {
    renderWithRouterMatch(
      <ObjectDelete
        bucketName={BUCKET_NAME}
        toggled={List([s3ObjectToDelete])}
        bucketInfo={BUCKET_INFO}
        prefixWithSlash=""
      />,
      undefined,
      {
        uiObjects: {
          showObjectDelete: true,
        },
      },
    );

    expect(screen.queryByText('Confirmation')).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    expect(screen.queryByText('Confirmation')).toBeNull();
  });
  it('should call deleteFiles if delete button is pressed', async () => {
    const deleteInterceptor = jest.fn();
    server.use(
      rest.post('http://testendpoint/bucket', (req, res, ctx) => {
        if (req.url.searchParams.toString() === 'delete=') {
          deleteInterceptor(req.body);
          return res(ctx.status(200), ctx.json({}));
        } else {
          return res(ctx.status(500));
        }
      }),
    );

    renderWithRouterMatch(
      <ObjectDelete
        bucketName={BUCKET_NAME}
        toggled={List([s3ObjectToDelete])}
        bucketInfo={BUCKET_INFO}
        prefixWithSlash=""
      />,
      undefined,
      {
        uiObjects: {
          showObjectDelete: true,
        },
      },
    );

    expect(screen.queryByText('Confirmation')).toBeInTheDocument();

    userEvent.click(
      screen.getByRole('checkbox', { name: /confirm the deletion/i }),
    );

    expect(
      screen.getByRole('checkbox', { name: /confirm the deletion/i }),
    ).toBeChecked();

    userEvent.click(screen.getByRole('button', { name: /Delete/i }));

    await waitFor(() => {
      return expect(deleteInterceptor).toHaveBeenCalled();
    });

    expect(deleteInterceptor).toHaveBeenCalledWith(
      `<Delete xmlns="http://s3.amazonaws.com/doc/2006-03-01/"><Object><Key>${s3ObjectToDelete.key}</Key><VersionId>${s3ObjectToDelete.versionId}</VersionId></Object></Delete>`,
    );

    // Close the modal
    expect(screen.queryByText('Confirmation')).toBeNull();
  });
});

describe('getMessagesAndRequiredActions', () => {
  //Singular messages tests
  it('should display permanently removal info banner when removing an object on a non versioned bucket', () => {
    const resultOneObject = getMessagesAndRequiredActions({
      isBucketVersioned: false,
      numberOfObjects: 1,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: false,
    });

    expect(resultOneObject).toStrictEqual({
      info: 'The selected object will be permanently deleted.',
      warnings: [],
      checkboxRequired: true,
      confirmationRequired: false,
      isDeletionPossible: true,
    });
  });

  it('should display delete marker info banner when removing the default version of a versioned object', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 1,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: false,
    });
    expect(result).toStrictEqual({
      info: 'Delete marker will be added to the object.',
      warnings: [],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: true,
    });
  });

  it('should display permanently removal info banner when removing a specific version of a versioned object', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 1,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: true,
    });
    expect(result).toStrictEqual({
      info: 'The selected version will be permanently deleted.',
      warnings: [],
      checkboxRequired: true,
      confirmationRequired: false,
      isDeletionPossible: true,
    });
  });

  it('should display delete marker info banner when removing the default version of a versioned locked object in Governance Mode', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 1,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 1,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: false,
    });
    expect(result).toStrictEqual({
      info: 'Delete marker will be added to the object.',
      warnings: [],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: true,
    });
  });

  it('should display delete marker info banner when removing the default version of a versioned locked object in Compliance Mode', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 1,
      objectsLockedInComplianceModeLength: 1,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: false,
    });
    expect(result).toStrictEqual({
      info: 'Delete marker will be added to the object.',
      warnings: [],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: true,
    });
  });

  it('should display permanently removal warning banner when removing a specific version of a versioned locked object in Governance Mode', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 1,
      objectsLockedInGovernanceModeLength: 1,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: true,
    });

    expect(result).toStrictEqual({
      info: 'The selected version will be permanently deleted.',
      warnings: [WarningTypes.GOVERNANCE],
      checkboxRequired: false,
      confirmationRequired: true,
      isDeletionPossible: true,
    });
  });

  it('should display impossible removal warning banner when removing a specific version of a versioned locked object in Compliance Mode', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 1,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInComplianceModeLength: 1,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: true,
    });

    expect(result).toStrictEqual({
      info: '',
      warnings: [WarningTypes.COMPLIANCE],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: false,
    });
  });

  it('should display impossible removal warning banner when removing a specific version of a versioned locked object with legal hold', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 1,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInLegalHoldLength: 1,
      selectedObjectsAreSpecificVersions: true,
    });

    expect(result).toStrictEqual({
      info: '',
      warnings: [WarningTypes.LEGAL_HOLD],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: false,
    });
  });

  //Plural messages tests
  it('should display permanently removal plural info banner when removing some object on a non versioned bucket', () => {
    const resultManyObjects = getMessagesAndRequiredActions({
      isBucketVersioned: false,
      numberOfObjects: 3,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: false,
    });

    expect(resultManyObjects).toStrictEqual({
      info: 'The selected objects will be permanently deleted.',
      warnings: [],
      checkboxRequired: true,
      confirmationRequired: false,
      isDeletionPossible: true,
    });
  });

  it('should display delete marker plural info banner when removing the default version of some versioned object', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 3,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: false,
    });
    expect(result).toStrictEqual({
      info: 'Delete markers will be added to the objects.',
      warnings: [],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: true,
    });
  });

  it('should display permanently removal plural info banner when removing a specific version of some versioned object', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 3,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: true,
    });
    expect(result).toStrictEqual({
      info: 'The selected versions will be permanently deleted.',
      warnings: [],
      checkboxRequired: true,
      confirmationRequired: false,
      isDeletionPossible: true,
    });
  });

  it('should display delete marker plural info banner when removing the default version of some versioned locked object in Governance Mode', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 3,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 3,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: false,
    });
    expect(result).toStrictEqual({
      info: 'Delete markers will be added to the objects.',
      warnings: [],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: true,
    });
  });

  it('should display delete marker plural info banner when removing the default version of some versioned locked object in Compliance Mode', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 3,
      objectsLockedInComplianceModeLength: 3,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: false,
    });
    expect(result).toStrictEqual({
      info: 'Delete markers will be added to the objects.',
      warnings: [],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: true,
    });
  });

  it('should display permanently removal plural warning banner when removing a specific version of some versioned locked object in Governance Mode', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 3,
      objectsLockedInGovernanceModeLength: 3,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: true,
    });

    expect(result).toStrictEqual({
      info: 'The selected versions will be permanently deleted.',
      warnings: [WarningTypes.GOVERNANCE],
      checkboxRequired: false,
      confirmationRequired: true,
      isDeletionPossible: true,
    });
  });

  it('should display impossible removal plural warning banner when removing a specific version of some versioned locked object in Compliance Mode', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 3,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInComplianceModeLength: 3,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: true,
    });

    expect(result).toStrictEqual({
      info: '',
      warnings: [WarningTypes.COMPLIANCE],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: false,
    });
  });

  it('should display impossible removal plural warning banner when removing a specific version of some versioned locked object with legal hold', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 3,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInLegalHoldLength: 3,
      selectedObjectsAreSpecificVersions: true,
    });

    expect(result).toStrictEqual({
      info: '',
      warnings: [WarningTypes.LEGAL_HOLD],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: false,
    });
  });

  it('should display permanently removal info banner when deleting default versions of locked objects in several mode and non locked objects', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 4,
      objectsLockedInComplianceModeLength: 1,
      objectsLockedInGovernanceModeLength: 1,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: false,
    });

    expect(result).toStrictEqual({
      info: 'Delete markers will be added to the objects.',
      warnings: [],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: true,
    });
  });

  it('should display impossible removal warning banner when trying to delete specific versions of compliance locked objects and non locked objects', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 4,
      objectsLockedInComplianceModeLength: 1,
      objectsLockedInGovernanceModeLength: 1,
      objectsLockedInLegalHoldLength: 0,
      selectedObjectsAreSpecificVersions: true,
    });

    expect(result).toStrictEqual({
      info: '',
      warnings: [WarningTypes.COMPLIANCE],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: false,
    });
  });

  it('should display impossible removal warning banner when trying to delete specific versions of legal hold objects and non locked objects', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 4,
      objectsLockedInComplianceModeLength: 0,
      objectsLockedInGovernanceModeLength: 1,
      objectsLockedInLegalHoldLength: 1,
      selectedObjectsAreSpecificVersions: true,
    });

    expect(result).toStrictEqual({
      info: '',
      warnings: [WarningTypes.LEGAL_HOLD],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: false,
    });
  });

  it('should display impossible removal  with multiple warnings banner when trying to delete specific versions of legal hold locked objects, compliance mode, and non locked objects', () => {
    const result = getMessagesAndRequiredActions({
      isBucketVersioned: true,
      numberOfObjects: 4,
      objectsLockedInComplianceModeLength: 1,
      objectsLockedInGovernanceModeLength: 0,
      objectsLockedInLegalHoldLength: 1,
      selectedObjectsAreSpecificVersions: true,
    });

    expect(result).toStrictEqual({
      info: '',
      warnings: [WarningTypes.COMPLIANCE, WarningTypes.LEGAL_HOLD],
      checkboxRequired: false,
      confirmationRequired: false,
      isDeletionPossible: false,
    });
  });
});
