import {
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { setupServer } from 'msw/node';
import { getConfigOverlay } from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';
import {
  TEST_API_BASE_URL,
  renderWithRouterMatch,
  selectClick,
} from '../../utils/testUtil';
import EndpointCreate from '../EndpointCreate';
import { useArtescaLibrary } from '../../next-architecture/ui/ArtescaLibraryProvider';
import userEvent from '@testing-library/user-event';
jest.mock('../../next-architecture/ui/ArtescaLibraryProvider');
const mockUseArtescaLibrary = useArtescaLibrary as jest.Mock;

const server = setupServer(getConfigOverlay(TEST_API_BASE_URL, INSTANCE_ID));

describe('EndpointCreate', () => {
  beforeAll(() => server.listen());
  beforeEach(() => {
    mockUseArtescaLibrary.mockReturnValue({
      useArtescaPlusVeeamDefaultOrOpenMode: () => ({
        artescaPlusVeeamDefaultOrOpenMode: 'default',
        artescaPlusVeeamDefaultOrOpenModeStatus: 'success',
      }),
    });
  });
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());
  it('should disable cold location as a source storage location when creating a data service', async () => {
    const coldLocation = 'europe25-myroom-cold';
    //E
    await renderWithRouterMatch(<EndpointCreate />, undefined, {
      configuration: {
        latest: {
          locations: {
            [coldLocation]: {
              locationType: 'location-dmf-v1',
              name: coldLocation,
              isCold: true,
              details: {
                endpoint: 'ws://tape.myroom.europe25.cnes:8181',
                repoId: ['repoId'],
                nsId: 'nsId',
                username: 'username',
                password: 'password',
              },
            },
          },
        },
      },
    });

    await waitForElementToBeRemoved(() =>
      screen.getByText('Loading locations...'),
    );

    await selectClick(
      screen.getByRole('textbox', { name: /Storage Location/i }),
    );
    //V
    expect(
      screen.queryByRole('option', { name: new RegExp(coldLocation, 'i') }),
    ).toHaveAttribute('aria-disabled', 'true');
  });

  it('should always render the warning message', async () => {
    const coldLocation = 'europe25-myroom-cold';
    //E
    await renderWithRouterMatch(<EndpointCreate />, undefined, {
      configuration: {
        latest: {
          locations: {
            [coldLocation]: {
              locationType: 'location-dmf-v1',
              name: coldLocation,
              isCold: true,
              details: {
                endpoint: 'ws://tape.myroom.europe25.cnes:8181',
                repoId: ['repoId'],
                nsId: 'nsId',
                username: 'username',
                password: 'password',
              },
            },
          },
        },
      },
    });

    await waitForElementToBeRemoved(() =>
      screen.getByText('Loading locations...'),
    );

    const warningMessages = [
      `Expect some delay—creating a new Data Service takes time.`,
      `Creating a new Data Service will regenerate all Certificates related to Data Services. If these Certificates were already replaced by ones issued by your Authority, they will have to be replaced again. Contact your Platform admin if needed.`,
    ];

    warningMessages.forEach((message) => {
      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });
  it('should disable the create data service button in Artesca+Veeam default mode', async () => {
    renderWithRouterMatch(<EndpointCreate />);
    await waitForElementToBeRemoved(() =>
      screen.getByText('Loading locations...'),
    );

    expect(screen.getByRole('button', { name: /Create/ })).toBeDisabled();
    await userEvent.hover(screen.getByRole('button', { name: /Create/ }));
    await waitFor(() => {
      expect(
        screen.getByText(
          /This action is disabled in the default ARTESCA \+ Veeam deployment due to enforced security settings. Please refer to the documentation to enable this functionality./i,
        ),
      ).toBeInTheDocument();
    });
  });
  it('should enable the create data service button in Artesca+Veeam open mode', async () => {
    mockUseArtescaLibrary.mockReturnValue({
      useArtescaPlusVeeamDefaultOrOpenMode: () => ({
        artescaPlusVeeamDefaultOrOpenMode: 'open',
        artescaPlusVeeamDefaultOrOpenModeStatus: 'success',
      }),
    });
    renderWithRouterMatch(<EndpointCreate />);
    await waitForElementToBeRemoved(() =>
      screen.getByText('Loading locations...'),
    );
    userEvent.type(screen.getByRole('textbox', { name: /Hostname/i }), 'test');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create/ })).toBeEnabled();
    });
  });
});
