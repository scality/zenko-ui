import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { reduxRender, TEST_API_BASE_URL } from '../../../utils/testUtil';
import { PauseAndResume } from '../PauseAndResume';

describe('PauseAndResume', () => {
  const instanceId = 'instanceId';
  const locationName = 'someLocation';
  const server = setupServer(
    rest.post(
      `${TEST_API_BASE_URL}/_/backbeat/api/crr/pause/someLocation`,
      (req, res, ctx) => res(ctx.status(200)),
    ),
    rest.post(
      `${TEST_API_BASE_URL}/_/backbeat/api/ingestion/pause/someLocation`,
      (req, res, ctx) => res(ctx.status(200)),
    ),
  );

  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  it('should render the component with pause label when ingestion is enabled', async () => {
    server.use(
      rest.get(
        `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/status`,
        (req, res, ctx) =>
          res(
            ctx.json({
              metrics: {
                ['ingest-schedule']: {
                  states: { [locationName]: 'enabled' },
                },
              },
              state: null,
            }),
          ),
      ),
    );
    reduxRender(<PauseAndResume locationName={locationName} />, {
      instances: {
        selectedId: instanceId,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText('Loading'), {
      timeout: 8000,
    });

    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause/i })).not.toBeDisabled();
  });

  it('should render the component with pause label when ingestion is an empty object', async () => {
    server.use(
      rest.get(
        `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/status`,
        (req, res, ctx) =>
          res(
            ctx.json({
              metrics: {
                ['crr-schedule']: {
                  states: { [locationName]: 'enabled' },
                },
                ['ingest-schedule']: {},
              },
              state: null,
            }),
          ),
      ),
    );
    reduxRender(<PauseAndResume locationName={locationName} />, {
      instances: {
        selectedId: instanceId,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText('Loading'), {
      timeout: 8000,
    });

    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause/i })).not.toBeDisabled();
  });

  it('should render the component with pause label when replication is enabled', async () => {
    server.use(
      rest.get(
        `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/status`,
        (req, res, ctx) =>
          res(
            ctx.json({
              metrics: {
                ['crr-schedule']: { states: { [locationName]: 'enabled' } },
              },
              state: null,
            }),
          ),
      ),
    );
    reduxRender(<PauseAndResume locationName={locationName} />, {
      instances: {
        selectedId: instanceId,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText('Loading'), {
      timeout: 8000,
    });

    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause/i })).not.toBeDisabled();
  });

  it('should render the component with pause label when both replication and ingestion are enabled', async () => {
    server.use(
      rest.get(
        `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/status`,
        (req, res, ctx) =>
          res(
            ctx.json({
              metrics: {
                ['ingest-schedule']: {
                  states: { [locationName]: 'enabled' },
                },
                ['crr-schedule']: { states: { [locationName]: 'enabled' } },
              },
              state: null,
            }),
          ),
      ),
    );

    reduxRender(<PauseAndResume locationName={locationName} />, {
      instances: {
        selectedId: instanceId,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText('Loading'), {
      timeout: 8000,
    });

    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pause/i })).not.toBeDisabled();
  });

  [
    { ingestionStatus: 'enabled', replicationStatus: 'enabled' },
    { ingestionStatus: null, replicationStatus: 'enabled' },
    { ingestionStatus: 'enabled', replicationStatus: null },
  ].forEach((testCase) => {
    it(`should disable the pause button while performing the action and then resolve with a resume button for {ingestionStatus: ${testCase.ingestionStatus}, replicationStatus: ${testCase.replicationStatus}}`, async () => {
      //S
      server.use(
        rest.get(
          `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/status`,
          (req, res, ctx) =>
            res(
              ctx.json({
                metrics: {
                  ['ingest-schedule']: testCase.ingestionStatus
                    ? {
                        states: { [locationName]: testCase.ingestionStatus },
                      }
                    : {},
                  ['crr-schedule']: testCase.replicationStatus
                    ? { states: { [locationName]: testCase.replicationStatus } }
                    : {},
                },
                state: null,
              }),
            ),
        ),
      );

      const pauseButtonSelector = () =>
        screen.getByRole('button', { name: /Pause/i });
      const resumeButtonSelector = () =>
        screen.getByRole('button', { name: /resume/i });

      reduxRender(<PauseAndResume locationName={locationName} />, {
        instances: {
          selectedId: instanceId,
        },
      });

      await waitForElementToBeRemoved(() => screen.queryByText('Loading'), {
        timeout: 8000,
      });

      expect(pauseButtonSelector()).toBeInTheDocument();
      expect(pauseButtonSelector()).not.toBeDisabled();

      //E
      userEvent.click(pauseButtonSelector());

      //V
      expect(pauseButtonSelector()).toBeDisabled();

      //S
      server.use(
        rest.get(
          `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/status`,
          (req, res, ctx) => {
            return res(
              ctx.json({
                metrics: {
                  ['ingest-schedule']: testCase.ingestionStatus
                    ? {
                        states: { [locationName]: 'disabled' },
                      }
                    : {},
                  ['crr-schedule']: testCase.replicationStatus
                    ? { states: { [locationName]: 'disabled' } }
                    : {},
                },
                state: null,
              }),
            );
          },
        ),
      );

      //E
      await waitFor(() => resumeButtonSelector(), { timeout: 2000 });
      //V
      expect(resumeButtonSelector()).not.toBeDisabled();
    });
  });

  it('should render the component with resume label when ingestion is disabled', async () => {
    server.use(
      rest.get(
        `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/status`,
        (req, res, ctx) =>
          res(
            ctx.json({
              metrics: {
                ['ingest-schedule']: {
                  states: { [locationName]: 'disabled' },
                },
              },
              state: null,
            }),
          ),
      ),
    );

    reduxRender(<PauseAndResume locationName={locationName} />, {
      instances: {
        selectedId: instanceId,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText('Loading'), {
      timeout: 8000,
    });

    expect(screen.getByRole('button', { name: /Resume/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resume/i })).not.toBeDisabled();
  });

  it('should render the component with resume label when replication is disabled', async () => {
    server.use(
      rest.get(
        `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/status`,
        (req, res, ctx) =>
          res(
            ctx.json({
              metrics: {
                ['crr-schedule']: { states: { [locationName]: 'disabled' } },
              },
              state: null,
            }),
          ),
      ),
    );
    reduxRender(<PauseAndResume locationName={locationName} />, {
      instances: {
        selectedId: instanceId,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText('Loading'), {
      timeout: 8000,
    });

    expect(screen.getByRole('button', { name: /Resume/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resume/i })).not.toBeDisabled();
  });

  it('should render the component with pause label when one of the two processes are enabled (while loading/processing an action)', async () => {
    server.use(
      rest.get(
        `${TEST_API_BASE_URL}/api/v1/instance/${instanceId}/status`,
        (req, res, ctx) =>
          res(
            ctx.json({
              metrics: {
                ['ingest-schedule']: {
                  states: { [locationName]: 'enabled' },
                },
                ['crr-schedule']: { states: { [locationName]: 'disabled' } },
              },
              state: null,
            }),
          ),
      ),
    );

    reduxRender(<PauseAndResume locationName={locationName} />, {
      instances: {
        selectedId: instanceId,
      },
    });

    await waitForElementToBeRemoved(() => screen.queryByText('Loading'), {
      timeout: 8000,
    });

    expect(screen.getByRole('button', { name: /Pause/i })).toBeInTheDocument();
  });

  it('should render the spinner component when loading', async () => {
    reduxRender(<PauseAndResume locationName={locationName} />, {
      instances: {
        selectedId: instanceId,
      },
    });

    expect(screen.getByText('Loading')).toBeInTheDocument();
  });
});
