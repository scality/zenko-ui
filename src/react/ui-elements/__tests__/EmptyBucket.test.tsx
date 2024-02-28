import {
  fireEvent,
  getByRole,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import {
  mockBucketListing,
  mockObjectEmpty,
  mockObjectListing,
} from '../../../js/mock/S3ClientMSWHandlers';
import {
  mockOffsetSize,
  renderWithRouterMatch,
  zenkoUITestConfig,
} from '../../utils/testUtil';
import { EmptyBucket } from '../EmptyBucket';
import { EMPTY_CONFIRMATION_MODAL_TITLE } from '../EmptyBucket/constants';

const bucketName = 'test-bucket';

function mockConfig() {
  return rest.get(`http://localhost/config.json`, (req, res, ctx) => {
    return res(ctx.json(zenkoUITestConfig));
  });
}

const server = setupServer(
  mockConfig(),
  mockBucketListing(),
  mockObjectListing(bucketName),
);

describe('EmptyConfirmation', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
    jest.setTimeout(30000);
    mockOffsetSize(500, 100);
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const selectors = {
    emptyButton: () => screen.getByRole('button', { name: /Empty Bucket/i }),
    modal: () =>
      screen.getByRole('dialog', {
        name: new RegExp(`Empty Bucket '${bucketName}'?`, 'i'),
      }),
    confirmButton: () =>
      getByRole(selectors.modal(), 'button', { name: /Empty/i }),
    confirmInput: () => screen.getByRole('textbox', { name: /Confirm/i }),
    emptyBucket: () => screen.getByText(EMPTY_CONFIRMATION_MODAL_TITLE),
    deletionLoading: () => screen.getByText(/Deletion in progress/),
    deletionAttempts: (deletionNumber: number) =>
      screen.getByText(new RegExp(`${deletionNumber} deletion attempts`, 'i')),
    summaryModal: () => screen.getByRole('dialog', { name: /Summary/i }),
    objectsAttemptsNumber: (obj: number) =>
      screen.getAllByText(new RegExp(`${obj} object`, 'i')),
    successIcon: () => screen.getByLabelText('Check-circle'),
    errorIcon: () => screen.getByLabelText('Exclamation-circle'),
    error: () => screen.getByText('Error'),
    closeButton: () => screen.getByRole('button', { name: 'Close' }),
  };

  it('should render empty button', () => {
    renderWithRouterMatch(<EmptyBucket bucketName={bucketName} />);

    expect(selectors.emptyBucket()).toBeInTheDocument();
  });

  it('should display modal', async () => {
    renderWithRouterMatch(<EmptyBucket bucketName={bucketName} />);
    fireEvent.click(selectors.emptyButton());

    await waitFor(() => {
      expect(selectors.modal()).toBeInTheDocument();
    });
  });

  it('should enable button once typed confirm', async () => {
    renderWithRouterMatch(<EmptyBucket bucketName={bucketName} />);
    fireEvent.click(selectors.emptyButton());
    await userEvent.type(selectors.confirmInput(), bucketName);
    fireEvent.click(selectors.confirmButton());

    expect(selectors.confirmInput()).toHaveValue(bucketName);
    await waitFor(() => {
      expect(selectors.confirmButton()).toBeEnabled();
    });
  });

  it('displays loading state during deletion', async () => {
    renderWithRouterMatch(<EmptyBucket bucketName={bucketName} />);
    fireEvent.click(selectors.emptyButton());
    await userEvent.type(selectors.confirmInput(), bucketName);

    await waitFor(() => {
      expect(selectors.confirmButton()).toBeEnabled();
    });

    await userEvent.click(selectors.confirmButton());

    await waitFor(() => {
      expect(selectors.deletionLoading()).toBeInTheDocument();
    });
  });

  it('fetch the data when user approve', async () => {
    renderWithRouterMatch(<EmptyBucket bucketName={bucketName} />);
    fireEvent.click(selectors.emptyButton());
    await userEvent.type(selectors.confirmInput(), bucketName);

    await waitFor(() => {
      expect(selectors.confirmButton()).toBeEnabled();
    });

    await userEvent.click(selectors.confirmButton());

    await waitFor(() => {
      expect(selectors.deletionLoading()).toBeInTheDocument();
    });

    await waitForElementToBeRemoved(
      () => screen.getByText(/Deletion in progress/i),
      { timeout: 10_000 },
    );
  });

  it('should display summary', async () => {
    renderWithRouterMatch(<EmptyBucket bucketName={bucketName} />);
    fireEvent.click(selectors.emptyButton());
    await userEvent.type(selectors.confirmInput(), bucketName);

    await waitFor(() => {
      expect(selectors.confirmButton()).toBeEnabled();
    });

    await userEvent.click(selectors.confirmButton());

    await waitFor(() => {
      expect(selectors.deletionLoading()).toBeInTheDocument();
    });

    await waitFor(() => {
      server.use(
        rest.post(
          `${zenkoUITestConfig.zenkoEndpoint}/${bucketName}`,
          (req, res, ctx) => {
            return res(
              ctx.xml(`
              <DeleteResult xmlns ="http://s3.amazonaws.com/doc/2006-03-01/">
                <Error>
                  <Key>276267</Key>
                  <VersionId>aJf</VersionId>
                </Error>
            </DeleteResult>`),
            );
          },
        ),
      );
    });

    await waitFor(
      () => {
        expect(selectors.deletionAttempts(1)).toBeInTheDocument();
      },
      {
        timeout: 10_000,
      },
    );

    await waitFor(() => {
      expect(selectors.summaryModal()).toBeInTheDocument();
    });

    const attempts = selectors.objectsAttemptsNumber(1)[0];

    expect(attempts).toBeInTheDocument();
    expect(selectors.successIcon()).toBeInTheDocument();
    expect(selectors.errorIcon()).toBeInTheDocument();
  });

  it('should display error banner', async () => {
    renderWithRouterMatch(<EmptyBucket bucketName={bucketName} />);
    fireEvent.click(selectors.emptyButton());
    await userEvent.type(selectors.confirmInput(), bucketName);

    await waitFor(() => {
      expect(selectors.confirmButton()).toBeEnabled();
    });

    await userEvent.click(selectors.confirmButton());

    await waitFor(() => {
      expect(selectors.deletionLoading()).toBeInTheDocument();
    });

    await waitFor(() => {
      server.use(
        rest.post(
          `${zenkoUITestConfig.zenkoEndpoint}/${bucketName}`,
          (req, res, ctx) => {
            return res(ctx.status(400));
          },
        ),
      );
    });

    await waitFor(
      () => {
        expect(selectors.error()).toBeInTheDocument();
      },
      {
        timeout: 10_000,
      },
    );
  });

  it('button should be disabled when no objects', async () => {
    await waitFor(() => {
      server.use(mockObjectEmpty(bucketName));
    });

    renderWithRouterMatch(<EmptyBucket bucketName={bucketName} />);

    await waitFor(() => {
      expect(selectors.emptyButton()).toBeDisabled();
    });
  });

  it('button should be disabled after deletion', async () => {
    renderWithRouterMatch(<EmptyBucket bucketName={bucketName} />);
    fireEvent.click(selectors.emptyButton());
    await userEvent.type(selectors.confirmInput(), bucketName);

    await waitFor(() => {
      expect(selectors.confirmButton()).toBeEnabled();
    });

    await userEvent.click(selectors.confirmButton());

    await waitFor(() => {
      expect(selectors.deletionLoading()).toBeInTheDocument();
    });

    await waitFor(() => {
      server.use(
        rest.post(
          `${zenkoUITestConfig.zenkoEndpoint}/${bucketName}`,
          (req, res, ctx) => {
            return res(
              ctx.xml(`
              <DeleteResult xmlns ="http://s3.amazonaws.com/doc/2006-03-01/">
                <Error>
                  <Key>276267</Key>
                  <VersionId>aJf</VersionId>
                </Error>
            </DeleteResult>`),
            );
          },
        ),
        mockObjectEmpty(bucketName),
      );
    });

    await waitFor(
      () => {
        expect(selectors.deletionAttempts(1)).toBeInTheDocument();
      },
      {
        timeout: 10_000,
      },
    );

    await userEvent.click(selectors.closeButton());

    await waitFor(() => {
      expect(selectors.emptyButton()).toBeDisabled();
    });
  });
});
