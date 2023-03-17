import { MemoryRouter } from 'react-router-dom';
import LocationEditor from '../LocationEditor';

import { fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { mockOffsetSize, reduxRender } from '../../../utils/test';

beforeAll(() => {
  mockOffsetSize(2000, 2000);
});
describe('LocationEditor', () => {
  it('should display storageOptions expect hidden options', () => {
    const {
      component: { container },
    } = reduxRender(
      <MemoryRouter>
        <LocationEditor />
      </MemoryRouter>,
    );

    const selector = notFalsyTypeGuard(
      container.querySelector('.sc-select__control'),
    );
    userEvent.click(selector);

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
      'Atlas Object Storage',
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
