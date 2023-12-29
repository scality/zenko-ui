import { debug } from 'jest-preview';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';

import * as s3object from '../../../actions/s3object';
import {
  BUCKET_NAME,
  FILE_NAME,
} from '../../../actions/__tests__/utils/testUtil';
import FolderCreate from '../FolderCreate';
import { reduxMount, renderWithRouterMatch } from '../../../utils/testUtil';
import { ThemeProvider } from 'styled-components';
import { coreUIAvailableThemes } from '@scality/core-ui/dist/style/theme';

describe('FolderCreate', () => {
  const modalTitle = 'Create a folder';
  it('should render an empty FolderCreate component if showFolderCreate equals to false', () => {
    renderWithRouterMatch(
      <FolderCreate bucketName={BUCKET_NAME} prefixWithSlash="" />,
      undefined,
      {
        uiObjects: {
          showFolderCreate: false,
        },
      },
    );

    expect(screen.queryByText(modalTitle)).not.toBeInTheDocument();
  });
  it('should call closeFolderCreateModal if cancel button is pressed', async () => {
    renderWithRouterMatch(
      <FolderCreate bucketName={BUCKET_NAME} prefixWithSlash="" />,
      undefined,
      {
        uiObjects: {
          showFolderCreate: true,
        },
      },
    );

    expect(screen.queryByText(modalTitle)).toBeInTheDocument();
    userEvent.click(
      screen.getByRole('button', {
        name: /cancel/i,
      }),
    );
    expect(screen.queryByText(modalTitle)).not.toBeInTheDocument();
  });

  it('should not createFolder if save button is pressed and folderName is empty', () => {
    renderWithRouterMatch(
      <FolderCreate bucketName={BUCKET_NAME} prefixWithSlash="" />,
      undefined,
      {
        uiObjects: {
          showFolderCreate: true,
        },
      },
    );

    expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
  });
  it('should call createFolder if save button is pressed and folderName is not empty', () => {
    const createFolderMock = jest.spyOn(s3object, 'createFolder');
    renderWithRouterMatch(
      <FolderCreate bucketName={BUCKET_NAME} prefixWithSlash="" />,
      undefined,
      {
        uiObjects: {
          showFolderCreate: true,
        },
      },
    );

    userEvent.type(screen.getByRole('textbox'), FILE_NAME);

    userEvent.click(
      screen.getByRole('button', {
        name: /save/i,
      }),
    );
    expect(createFolderMock).toHaveBeenCalledTimes(1);
  });
});
