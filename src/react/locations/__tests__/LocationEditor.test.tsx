import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import type { ReactElement } from 'react';
import { getConfigOverlay, getInstanceStatus, INSTANCE_ID } from '../../../js/mock/managementClientMSWHandlers';
import { mockOffsetSize, selectClick, TEST_API_BASE_URL, testRender, Wrapper } from '../../utils/testUtil';
import LocationEditor, { buildLocationTypeOptions } from '../LocationEditor';

jest.setTimeout(60_000);
const server = setupServer(
  getConfigOverlay(TEST_API_BASE_URL, INSTANCE_ID),
  getInstanceStatus(TEST_API_BASE_URL, INSTANCE_ID),
);

beforeAll(() => {
  server.listen();
  mockOffsetSize(2000, 2000);
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const generateMockLocations = (count: number) => {
  const locations: Record<string, any> = {};
  for (let i = 1; i <= count; i++) {
    locations[`location-${i}`] = {
      name: `location-${i}`,
      locationType: 'location-test',
      objectId: `id-${i}`,
      details: {},
    };
  }
  return locations;
};

const setupLocations = (count: number) => {
  server.use(
    rest.get(`${TEST_API_BASE_URL}/api/v1/config/overlay/view/${INSTANCE_ID}`, (_, res, ctx) =>
      res(
        ctx.json({
          locations: generateMockLocations(count),
          users: [],
          endpoints: [],
        }),
      ),
    ),
  );
};

describe('LocationEditor', () => {
  const selectors = {
    loadingLocation: () => screen.getByText('Loading location...'),
    selectLocationType: () => screen.getByRole('textbox', { name: /location type \*/i }),
    inputLocationType: () => screen.getByRole('textbox', { name: /location type \*/i }),
    optionLocationType: (locationName: string | RegExp) => screen.getByRole('option', { name: locationName }),
  };

  it('should hide the artesca storage service if it is already created', async () => {
    //S
    server.use(
      rest.get(`${TEST_API_BASE_URL}/api/v1/config/overlay/view/${INSTANCE_ID}`, (_, res, ctx) =>
        res(
          ctx.json({
            locations: {
              'us-east-2': {
                details: {
                  bootstrapList: ['artesca-storage-service-hdservice-proxy.xcore.svc:18888'],
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

  it('should not display a banner when fewer than 6 locations exist', async () => {
    setupLocations(5);

    testRender(<LocationEditor />);
    await waitForElementToBeRemoved(() => selectors.loadingLocation());

    expect(screen.queryByText(/locations have been created on this instance/i)).toBeNull();
    expect(screen.queryByText(/storage locations. It is strongly recommended/i)).toBeNull();
  });

  it('should display a warning banner when 6-9 locations exist', async () => {
    setupLocations(8);

    testRender(<LocationEditor />);
    await waitForElementToBeRemoved(() => selectors.loadingLocation());

    await waitFor(() => {
      const warningText = screen.getByText(/8 of 10 locations have been created on this instance/i);
      expect(warningText).toBeInTheDocument();
    });
  });

  it('should display a danger banner when 10 or more locations exist', async () => {
    setupLocations(12);

    testRender(<LocationEditor />);
    await waitForElementToBeRemoved(() => selectors.loadingLocation());

    await waitFor(() => {
      const dangerText = screen.getByText(/This instance has already 12 storage locations/i);
      expect(dangerText).toBeInTheDocument();
    });
  });
});

type OptionElement = ReactElement<{ disabled: boolean; value: string; children: string }>;

describe('buildLocationTypeOptions', () => {
  it('emits each group header as a disabled Option', () => {
    const result = buildLocationTypeOptions([
      { label: 'My Group', options: [{ value: 'a', label: 'A', disabled: false, category: 'crr' }] },
    ]);
    const header = result[0] as OptionElement;
    expect(header.props.disabled).toBe(true);
    expect(header.props.children).toBe('My Group');
  });

  it('propagates the disabled flag from filtered options to Options', () => {
    const result = buildLocationTypeOptions([
      { label: 'X', options: [{ value: 'a', label: 'A', disabled: true, category: 'crr' }] },
    ]);
    const option = result[1] as OptionElement;
    expect(option.props.disabled).toBe(true);
    expect(option.props.value).toBe('a');
  });
});
