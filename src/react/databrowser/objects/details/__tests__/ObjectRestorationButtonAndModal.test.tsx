import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
  Wrapper as wrapper,
} from '../../../../utils/test';
import ObjectRestorationButtonAndModal from '../ObjectRestorationButtonAndModal';

const bucketName = 'bucket';
const objectKey = 'objectKey';
const versionId = 'VersionId';
const storageClass = 'Azure archive';
const lastModified = '2020-07-06 16:22:00';

const server = setupServer(
  rest.post(
    `${TEST_API_BASE_URL}/${bucketName}/${objectKey}`,
    (req, res, ctx) => {
      if (
        req.url.searchParams.get('versionId') === versionId &&
        req.url.searchParams.has('restore')
      ) {
        return res(ctx.status(202));
      }
    },
  ),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  mockOffsetSize(200, 800);
  jest.setTimeout(10_000);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Object Restoration Button And Modal', () => {
  it('should display error within a banner in case of failure', async () => {
    //S
    const errorMessage =
      'The operation is not valid for the current state of the object.';
    server.use(
      rest.post(
        `${TEST_API_BASE_URL}/${bucketName}/${objectKey}`,
        (req, res, ctx) => {
          if (
            req.url.searchParams.get('versionId') === versionId &&
            req.url.searchParams.has('restore')
          ) {
            return res(
              ctx.status(500),
              ctx.xml(
                `<?xml version="1.0" encoding="UTF-8"?>
               <Error>
                   <Code>InvalidObjectState</Code>
                   <Message>${errorMessage}</Message>
                   <Resource></Resource>
                   <RequestId>dfcc07e6a640977113e6</RequestId>
               </Error>`,
              ),
            );
          }
        },
      ),
    );
    //E
    reduxRender(
      <ObjectRestorationButtonAndModal
        bucketName={bucketName}
        objectKey={objectKey}
        objectStorageClass={storageClass}
        objectLastModifiesOn={lastModified}
        objectSize={11114905.6}
        objectVersionId={versionId}
        isObjectRestoredOrOnGoing={false}
      />,
      { wrapper },
    );
    userEvent.click(screen.getByRole('button', { name: /restore/i }));
    //V
    expect(screen.getByText(objectKey));
    expect(screen.getByText(lastModified));
    expect(screen.getByText(lastModified));
    expect(screen.getByText('10.6 MiB'));
    expect(screen.getByText(storageClass));
    //E
    userEvent.click(screen.getByRole('button', { name: /start restoration/i }));
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /start restoration/i }),
      ).toBeDisabled();
    });
    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /start restoration/i }),
        ).toBeEnabled();
      },
      { timeout: 8_000 },
    );

    //V
    expect(screen.getByText(errorMessage));
  });
});
