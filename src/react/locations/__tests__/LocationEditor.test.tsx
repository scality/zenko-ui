import { MemoryRouter } from 'react-router-dom';
import LocationEditor from '../LocationEditor';

import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import {
  TEST_API_BASE_URL,
  Wrapper,
  mockOffsetSize,
  reduxRender,
  selectClick,
} from '../../utils/testUtil';
import { setupServer } from 'msw/node';
import { getConfigOverlay } from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';

const server = setupServer(getConfigOverlay(TEST_API_BASE_URL, INSTANCE_ID));

beforeAll(() => {
  server.listen();
  mockOffsetSize(2000, 2000);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
describe('LocationEditor', () => {
  it('should display storageOptions expect hidden options', async () => {
    const {
      component: { container },
    } = reduxRender(
      <MemoryRouter>
        <LocationEditor />
      </MemoryRouter>,
    );

    await waitForElementToBeRemoved(() =>
      screen.getByText('Loading location...'),
    );

    const selector = notFalsyTypeGuard(
      container.querySelector('.sc-select__control'),
    );
    await selectClick(selector);
    await userEvent.keyboard('{arrowup}');

    expect(
      container.querySelector('.sc-select__option--is-focused')?.textContent,
    ).toBe('Storage Service for ARTESCA');

    [
      'Scality ARTESCA S3',
      'Scality RING with S3 Connector',
      'Amazon S3',
      'Google Cloud Storage',
      'Microsoft Azure Blob Storage',
      'Microsoft Azure Archive',
      'Atlas Object Storage (Free Pro)',
      '3DS Outscale OOS Public',
      '3DS Outscale OOS SNC',
      'Flexible Datastore',
      'Tape DMF',
    ].forEach((locationName) => {
      fireEvent.keyDown(selector, { key: 'ArrowDown', which: 40, keyCode: 40 });
      expect(
        container.querySelector('.sc-select__option--is-focused')?.textContent,
      ).toBe(locationName);
    });
  });
  const selectors = {
    loadingLocation: () => screen.getByText('Loading location...'),
    locationType: () => screen.getByLabelText(/location type \*/i),
  };

  it('should hide the artesca storage service if it is already created', async () => {
    //S
    server.use(
      rest.get(
        `${TEST_API_BASE_URL}/api/v1/config/overlay/view/${INSTANCE_ID}`,
        (_, res, ctx) =>
          res(
            ctx.json({
              locations: {
                'us-east-2': {
                  details: {
                    bootstrapList: [
                      'artesca-storage-service-hdservice-proxy.xcore.svc:18888',
                    ],
                    repoId: null,
                  },
                  locationType: 'location-scality-hdclient-v2',
                  name: 'us-east-2',
                  objectId: '22f31240-4bd3-11ee-98b3-1e5b6f897bc7',
                },
              },
            }),
          ),
      ),
    );
    render(<LocationEditor />, { wrapper: Wrapper });
    await waitForElementToBeRemoved(() => selectors.loadingLocation());
    //E
    selectClick(selectors.locationType());
    //V
    await waitFor(() => {
      expect(screen.queryByText('Storage Service for ARTESCA')).toBeNull();
    });
  });
});
