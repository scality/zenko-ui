import { MemoryRouter } from 'react-router-dom';
import LocationEditor from '../LocationEditor';

import {
  fireEvent,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { notFalsyTypeGuard } from '../../../types/typeGuards';
import {
  TEST_API_BASE_URL,
  mockOffsetSize,
  reduxRender,
  selectClick,
} from '../../utils/testUtil';
import { setupServer } from 'msw/node';
import { getConfigOverlay } from '../../../js/mock/managementClientMSWHandlers';
import { INSTANCE_ID } from '../../actions/__tests__/utils/testUtil';

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
    selectClick(selector);

    fireEvent.keyDown(selector, { key: 'ArrowDown', which: 40, keyCode: 40 });
    fireEvent.keyDown(selector, { key: 'ArrowUp', which: 38, keyCode: 38 });
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
});
