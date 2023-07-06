import { screen } from '@testing-library/react';
import { renderWithRouterMatch, selectClick } from '../../utils/testUtil';
import EndpointCreate from '../EndpointCreate';

describe('EndpointCreate', () => {
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

    selectClick(screen.getByText('Location Name'));
    //V
    expect(
      screen.queryByRole('option', { name: new RegExp(coldLocation, 'i') }),
    ).toHaveAttribute('aria-disabled', 'true');
  });
});
