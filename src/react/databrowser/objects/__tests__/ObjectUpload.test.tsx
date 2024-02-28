import { act } from 'react-dom/test-utils';
import { fireEvent, screen, waitFor } from '@testing-library/react';
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
import { TextEncoder } from 'util';

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
const OBJECT_KEY = 'chucknorris.png';
const mockPutObject = jest.fn();
const server = setupServer(
  rest.post(`${TEST_API_BASE_URL}/`, (req, res, ctx) => {
    return res(
      ctx.json({
        IsTruncated: false,
        Accounts: [],
      }),
    );
  }),
  rest.put(
    `${TEST_API_BASE_URL}/${BUCKET_NAME}/${OBJECT_KEY}`,
    (req, res, ctx) => {
      mockPutObject(req.body);
      return res(ctx.status(200));
    },
  ),
);

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

    await userEvent.click(
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

  let index = 0;
  for (let t of tests) {
    it(t, async () => {
      const { container } = renderObjectUpload();

      act(() => {
        fireEvent.drop(
          screen.getByRole('button', {
            name: /drag and drop files and folders here/i,
          }),
          {
            dataTransfer: {
              files: [
                new File([new TextEncoder().encode('(⌐□_□)')], OBJECT_KEY, {
                  type: 'text/plain',
                }),
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
          await userEvent.click(
            screen.getByRole('button', {
              name: /cancel/i,
            }),
          );
          expect(container).toBeEmptyDOMElement();

          break;

        case 2:
          await userEvent.click(
            screen.getByRole('button', {
              name: 'Upload',
            }),
          );

          await waitFor(() => {
            expect(mockPutObject).toHaveBeenCalled();
          });

          expect(container).toBeEmptyDOMElement();

          break;

        case 3:
          await userEvent.click(
            screen.getByRole('button', {
              name: /close modal/i,
            }),
          );
          expect(container).toBeEmptyDOMElement();

          break;
      }
      index++;
    });
  }
});
