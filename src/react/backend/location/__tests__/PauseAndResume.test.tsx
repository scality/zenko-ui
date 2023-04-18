import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { reduxRender, TEST_API_BASE_URL } from '../../../utils/testUtil';
import { PauseAndResume } from '../PauseAndResume';

describe('PauseAndResume', () => {
  const instanceId = 'instanceId';
  const locationName = 'someLocation';
  const server = setupServer();

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
