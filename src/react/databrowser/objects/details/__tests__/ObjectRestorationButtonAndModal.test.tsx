import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockOffsetSize,
  reduxRender,
  TEST_API_BASE_URL,
  Wrapper as wrapper,
} from '../../../../utils/testUtil';
import { OBJECT_METADATA } from '../../../../actions/__tests__/utils/testUtil';
import ObjectRestorationButtonAndModal from '../ObjectRestorationButtonAndModal';
import { act } from 'react-dom/test-utils';

const bucketName = 'bucket';

const server = setupServer(
  rest.post(
    `${TEST_API_BASE_URL}/${bucketName}/${OBJECT_METADATA.objectKey}`,
    (req, res, ctx) => {
      if (
        req.url.searchParams.get('versionId') === OBJECT_METADATA.versionId &&
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

const errorMessage =
  'The operation is not valid for the current state of the object.';
const selectors = {
  restoreButtonSelector: () => screen.getByRole('button', { name: /restore/i }),
  startRestorationButtonSelector: () =>
    screen.getByRole('button', {
      name: /start restoration/i,
    }),
  objectTableRowSeletor: () =>
    screen.getByRole('row', {
      name: new RegExp(
        `${OBJECT_METADATA.objectKey} 2020-10-16 10:06:54 4.32 MiB ${OBJECT_METADATA.storageClass}`,
      ),
    }),
  errorBannerSelector: () => screen.getByText(errorMessage),
  restorationModalSelector: () => screen.queryByText('Restore Object?'),
};

describe('Object Restoration Button And Modal', () => {
  it('should close the modal after the restore action is successfully triggered', async () => {
    //E
    reduxRender(
      <ObjectRestorationButtonAndModal
        bucketName={bucketName}
        objectMetadata={OBJECT_METADATA}
      />,
      { wrapper },
    );
    act(() => {
      userEvent.click(selectors.restoreButtonSelector());
    });
    //V
    expect(selectors.objectTableRowSeletor());
    //E
    act(() => {
      userEvent.click(selectors.startRestorationButtonSelector());
    });
    await waitFor(() => {
      expect(selectors.startRestorationButtonSelector()).toBeDisabled();
    });
    //V
    await waitFor(() => {
      expect(selectors.restorationModalSelector()).toBeNull();
    });
  });
  it('should display error within a banner in case of failure', async () => {
    //S
    server.use(
      rest.post(
        `${TEST_API_BASE_URL}/${bucketName}/${OBJECT_METADATA.objectKey}`,
        (req, res, ctx) => {
          if (
            req.url.searchParams.get('versionId') ===
              OBJECT_METADATA.versionId &&
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
        objectMetadata={OBJECT_METADATA}
      />,
      { wrapper },
    );
    userEvent.click(selectors.restoreButtonSelector());
    //V
    expect(selectors.objectTableRowSeletor());
    //E
    userEvent.click(selectors.startRestorationButtonSelector());
    await waitFor(() => {
      expect(selectors.startRestorationButtonSelector()).toBeDisabled();
    });
    await waitFor(
      () => {
        expect(selectors.startRestorationButtonSelector()).toBeEnabled();
      },
      { timeout: 8_000 },
    );
    //V
    expect(selectors.errorBannerSelector());
  });
});
