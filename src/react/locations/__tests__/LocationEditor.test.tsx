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

jest.setTimeout(60_000);
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
    ).toBe('Scality ARTESCA S3');

    [
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
    selectLocationType: () => screen.getByLabelText(/location type \*/i),
    inputLocationType: () =>
      screen.getByRole('textbox', { name: /location type \*/i }),
    optionLocationType: (locationName: string | RegExp) =>
      screen.getByRole('option', { name: locationName }),
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
    selectClick(selectors.selectLocationType());
    //V
    await waitFor(() => {
      expect(screen.queryByText('Storage Service for ARTESCA')).toBeNull();
    });
  });

  it(`test if each location display correctly`, async () => {
    reduxRender(
      <MemoryRouter>
        <LocationEditor />
      </MemoryRouter>,
    );

    await waitForElementToBeRemoved(() =>
      screen.getByText('Loading location...'),
    );

    const locationsTests = [
      {
        name: 'Scality ARTESCA S3',
        optionToQuery: () =>
          selectors.optionLocationType(/Scality ARTESCA S3/i),
        checkField: () => screen.getByText(/access key \*/i),
      },
      {
        name: 'Scality RING with S3 Connector',
        optionToQuery: () =>
          selectors.optionLocationType(/Scality RING with S3 Connector/i),
        checkField: () => screen.getByText(/access key \*/i),
      },
      {
        name: 'Amazon S3',
        optionToQuery: () => selectors.optionLocationType(/Amazon S3/i),
        checkField: () => screen.getByText(/AWS Access Key \*/i),
      },
      {
        name: 'Google Cloud Storage',
        optionToQuery: () =>
          selectors.optionLocationType(/Google Cloud Storage/i),
        checkField: () => screen.getByText(/GCP Access Key \*/i),
      },
      {
        name: 'Microsoft Azure Blob Storage',
        optionToQuery: () =>
          selectors.optionLocationType(/Microsoft Azure Blob Storage/i),
        checkField: () => screen.getByText(/Blob endpoint \*/i),
      },
      {
        name: 'Microsoft Azure Archive',
        optionToQuery: () =>
          selectors.optionLocationType(/Microsoft Azure Archive/i),
        checkField: () => screen.getByText(/Blob endpoint \*/i),
      },
      {
        name: 'Atlas Object Storage (Free Pro)',
        optionToQuery: () =>
          selectors.optionLocationType(/Atlas Object Storage \(Free Pro\)/i),
        checkField: () => screen.getByText(/access key \*/i),
      },
      {
        name: '3DS Outscale OOS Public',
        optionToQuery: () =>
          selectors.optionLocationType(/3DS Outscale OOS Public/i),
        checkField: () => screen.getByText(/access key \*/i),
      },
      {
        name: '3DS Outscale OOS SNC',
        optionToQuery: () =>
          selectors.optionLocationType(/3DS Outscale OOS SNC/i),
        checkField: () => screen.getByText(/access key \*/i),
      },
      {
        name: 'Flexible Datastore',
        optionToQuery: () =>
          selectors.optionLocationType(/Flexible Datastore/i),
        checkField: () => screen.getByText(/access key \*/i),
      },
      {
        name: 'Tape DMF',
        optionToQuery: () => selectors.optionLocationType(/Tape DMF/i),
        checkField: () => screen.getByText(/Temperature/i),
      },
      {
        name: 'Ceph RADOS Gateway',
        optionToQuery: () =>
          selectors.optionLocationType(/Ceph RADOS Gateway/i),
        checkField: () => screen.getByText(/access key \*/i),
      },
      {
        name: 'Scality RING with Sproxyd Connector',
        optionToQuery: () =>
          selectors.optionLocationType(/Scality RING with Sproxyd Connector/i),
        checkField: () => screen.getByText(/Bootstrap List \*/i),
      },
      {
        name: 'Wasabi',
        optionToQuery: () => selectors.optionLocationType(/Wasabi/i),
        checkField: () => screen.getByText(/Wasabi Access Key \*/i),
      },
      {
        name: 'Oracle Cloud Object Storage',
        optionToQuery: () =>
          selectors.optionLocationType(/Oracle Cloud Object Storage/i),
        checkField: () => screen.getByText(/Namespace \*/i),
      },
    ];

    for await (const location of locationsTests) {
      await userEvent.click(screen.getByLabelText(/select a location type/i));

      await userEvent.clear(
        screen.getByRole('textbox', { name: /location type \*/i }),
      );
      await userEvent.type(
        screen.getByRole('textbox', { name: /location type \*/i }),
        location.name,
      );

      await userEvent.click(location.optionToQuery());
      expect(location.checkField()).toBeInTheDocument();
    }
  });
});
