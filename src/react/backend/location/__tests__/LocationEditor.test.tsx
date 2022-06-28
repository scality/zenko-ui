import LocationEditor from '../LocationEditor';
import { MemoryRouter } from 'react-router-dom';

import { mockOffsetSize, reduxRender } from '../../../utils/test';
import { fireEvent } from '@testing-library/react';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import userEvent from '@testing-library/user-event';

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
      'Scality Artesca S3',
      'Scality RING with S3 Connector',
      'Atlas Object Storage',
      'Flexible Datastore',
      'Amazon S3',
      'Google Cloud Storage',
      'Microsoft Azure Blob Storage',
      'Tape DMF',
    ].forEach((locationName) => {
      fireEvent.keyDown(selector, { key: 'ArrowDown', which: 40, keyCode: 40 });
      expect(
        container.querySelector('.sc-select__option--is-focused')?.textContent,
      ).toBe(locationName);
    });
  });
});
