import { act } from 'react-dom/test-utils';
import { debug } from 'jest-preview';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import ObjectUpload from '../ObjectUpload';
import { BUCKET_NAME } from '../../../actions/__tests__/utils/testUtil';
import {
  TEST_API_BASE_URL,
  mockOffsetSize,
  renderWithRouterMatch,
} from '../../../utils/testUtil';

const renderObjectUpload = () => {
  return renderWithRouterMatch(
    <ObjectUpload bucketName={BUCKET_NAME} />,
    undefined,
    {
      uiObjects: {
        showObjectUpload: true,
      },
    },
  );
};

const server = setupServer(
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
    return res(
      ctx.json({
        IsTruncated: false,
        Accounts: [],
      }),
    );
  }),
);
//
// rest.post(
//   `${TEST_API_BASE_URL}/api/v1/instance/${INSTANCE_ID}/account/${ACCOUNT_ID}/bucket/bucket/workflow/replication`,
//   (req, res, ctx) => {
//     return res(ctx.json([]));
//   },
// ),
// getConfigOverlay(TEST_API_BASE_URL, INSTANCE_ID),
// ...getStorageConsumptionMetricsHandlers(
//   zenkoUITestConfig.managementEndpoint,
//   INSTANCE_ID,
// ),

describe('ObjectUpload', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
    mockOffsetSize(200, 100);
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  it('should render an empty ObjectUpload component if showFolderCreate equals to false', () => {
    const { container } = renderWithRouterMatch(
      <ObjectUpload bucketName={BUCKET_NAME} />,
      undefined,
      {
        uiObjects: {
          showObjectUpload: false,
        },
      },
    );

    expect(container).toBeEmptyDOMElement();
  });
  it('should close the modal if cancel button is pressed when NoFile component is rendered', async () => {
    const { container } = renderObjectUpload();

    expect(
      screen.getByText(/Drag and drop files and folders here/i),
    ).toBeInTheDocument();

    userEvent.click(
      screen.getByRole('button', {
        name: /cancel/i,
      }),
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('should not call uploadFiles if upload button is pressed when no file is present', () => {
    renderObjectUpload();
    expect(screen.getByRole('button', { name: 'Upload' })).toBeDisabled();
  });

  const tests = [
    'should render FileList component',
    'should call closeObjectUploadModal if cancel button is pressed when FileList component is rendered',
    'should call uploadFile if upload button is pressed  when FileList component is rendered',
    'should remove file when pressing the cross and render NoFile when no file is present',
  ];
  tests.forEach((t, index) => {
    it(t, async () => {
      const { container } = renderObjectUpload();

      function mockData(files: File[]) {
        return {
          dataTransfer: {
            files,
            items: files.map((file) => ({
              kind: 'file',
              size: file.size,
              type: file.type,
              getAsFile: () => file,
            })),
            types: ['Files'],
          },
        };
      }

      const file = new File([JSON.stringify({ ping: true })], 'ping.json', {
        type: 'application/json',
      });
      const data = mockData([file]);

      act(() => {
        fireEvent.drop(
          screen.getByRole('button', {
            name: /drag and drop files and folders here/i,
          }),
          {
            dataTransfer: {
              files: [
                new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' }),
              ],
              types: ['Files'],
            },
          },
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Add more files/i)).toBeInTheDocument();
      });

      switch (index) {
        case 0:
          expect(screen.getByText(/Add more files/i)).toBeInTheDocument();
          break;

        case 1:
          userEvent.click(
            screen.getByRole('button', {
              name: /cancel/i,
            }),
          );
          expect(container).toBeEmptyDOMElement();

          break;

        case 2:
          userEvent.click(
            screen.getByRole('button', {
              name: 'Upload',
            }),
          );
          // FIXME Need to check with msw if it's called
          expect(container).toBeEmptyDOMElement();
          break;

        case 3:
          userEvent.click(
            screen.getByRole('button', {
              name: /close modal/i,
            }),
          );
          expect(container).toBeEmptyDOMElement();

          break;
      }
    });
  });
});
