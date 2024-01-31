import { screen, waitFor } from '@testing-library/react';
import { renderWithRouterMatch } from '../../utils/testUtil';
import { AuthorizedAdvancedMetricsButton } from '../AdvancedMetricsButton';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { useAuth } from '../../next-architecture/ui/AuthProvider';

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
    //@ts-expect-error fix this when you are working on it
    useAuth.mockImplementation(() => {
      return {
        userData: {
          id: 'xxx-yyy-zzzz-id',
          token: 'xxx-yyy-zzz-token',
          username: 'Renard ADMIN',
          email: 'renard.admin@scality.com',
          groups: ['StorageManager', 'user', 'PlatformAdmin'],
        },
      };
    });
    renderWithRouterMatch(<AuthorizedAdvancedMetricsButton />);

    //Wait for loading to complete
    await waitFor(() =>
      screen.getByRole('button', { name: /Advanced Metrics/i }),
    );

    expect(
      screen.getByRole('button', { name: /Advanced Metrics/i }),
    ).toBeInTheDocument();
  });

  it("should not display the button when groups doesn't contains StorageManager", async () => {
    //@ts-expect-error fix this when you are working on it
    useAuth.mockImplementation(() => {
      return {
        userData: {
          id: 'xxx-yyy-zzzz-id',
          token: 'xxx-yyy-zzz-token',
          username: 'Renard ADMIN',
          email: 'renard.admin@scality.com',
          groups: [],
        },
      };
    });
    renderWithRouterMatch(<AuthorizedAdvancedMetricsButton />);

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
