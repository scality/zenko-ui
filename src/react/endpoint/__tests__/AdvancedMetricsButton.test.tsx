import { screen, waitFor } from '@testing-library/react';
import { reduxRender } from '../../utils/testUtil';
import { AuthorizedAdvancedMetricsButton } from '../AdvancedMetricsButton';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const expectedBasePath = 'http://testurl';

const server = setupServer(
  rest.get(`http://localhost/config-shell.json`, (req, res, ctx) => {
    return res(
      ctx.json({
        options: { main: { [expectedBasePath]: { en: 'Overview' } } },
      }),
    );
  }),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('AdvancedMetricsButton', () => {
  it('should display the button when groups contains StorageManager', async () => {
    reduxRender(<AuthorizedAdvancedMetricsButton />, {
      oidc: { user: { profile: { groups: ['StorageManager'] } } },
    });

    //Wait for loading to complete
    await waitFor(() =>
      screen.getByRole('button', { name: /Advanced Metrics/i }),
    );

    expect(
      screen.getByRole('button', { name: /Advanced Metrics/i }),
    ).toBeInTheDocument();
  });

  it("should not display the button when groups doesn't contains StorageManager", async () => {
    reduxRender(<AuthorizedAdvancedMetricsButton />, {
      oidc: { user: { profile: { groups: [] } } },
    });

    await expect(
      (async () => {
        //Wait for loading to complete
        await waitFor(() =>
          screen.getByRole('button', { name: /Advanced Metrics/i }),
        );
      })(),
    ).rejects.not.toBeNull();
  });
});
