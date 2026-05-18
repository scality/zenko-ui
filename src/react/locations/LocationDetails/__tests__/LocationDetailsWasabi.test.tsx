import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LocationDetails } from '../../../../types/config';
import { NewWrapper } from '../../../utils/testUtil';
import { SECRET_KEY_PLACEHOLDER } from '../../LocationEditor';
import LocationDetailsWasabi from '../LocationDetailsWasabi';

const props = {
  details: {
    bucketMatch: false,
    accessKey: '',
    secretKey: '',
    bucketName: '',
    endpoint: 'https://s3.wasabisys.com',
  } as unknown as LocationDetails,
  onChange: () => {},
  editingExisting: false,
  locationType: 'location-wasabi-v1',
};
describe('class <LocationDetailsWasabi />', () => {
  const selectors = {
    accessKeySelector: () => screen.getByRole('textbox', { name: /Wasabi Access Key/ }),
    secretKeySelector: () => screen.getByPlaceholderText(new RegExp(SECRET_KEY_PLACEHOLDER)),
    bucketNameSelector: () => screen.getByRole('textbox', { name: /Wasabi Target Bucket Name/ }),
  };
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    render(<LocationDetailsWasabi {...props} onChange={onChangeFn} />, {
      wrapper: NewWrapper(),
    });
    expect(onChangeFn).toHaveBeenCalledWith({
      bucketMatch: false,
      accessKey: '',
      secretKey: '',
      bucketName: '',
      endpoint: 'https://s3.wasabisys.com',
    });
  });
  it('should call onChange on state update', async () => {
    const refLocation = {
      bucketMatch: true,
      accessKey: 'ak',
      secretKey: 'sk',
      bucketName: 'bn',
      endpoint: 'https://s3.wasabisys.com',
    };
    const onChangeFn = jest.fn();
    render(<LocationDetailsWasabi {...props} onChange={onChangeFn} />, {
      wrapper: NewWrapper(),
    });

    await waitFor(async () => {
      await userEvent.type(selectors.accessKeySelector(), 'ak');
    });
    await waitFor(async () => {
      await userEvent.type(selectors.secretKeySelector(), 'sk');
    });
    await waitFor(async () => {
      await userEvent.type(selectors.bucketNameSelector(), 'bn');
    });
  });
  it('should show wasabi details for empty details', () => {
    render(<LocationDetailsWasabi {...props} />, {
      wrapper: NewWrapper(),
    });

    expect(selectors.accessKeySelector()).toHaveValue('');
    expect(selectors.secretKeySelector()).toHaveValue('');
    expect(selectors.bucketNameSelector()).toHaveValue('');
  });
  it('should show custom details when editing an existing location', () => {
    const locationDetails = {
      endpoint: 'https://s3.wasabisys.com',
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
    } as unknown as LocationDetails;
    render(<LocationDetailsWasabi {...props} details={locationDetails} />, {
      wrapper: NewWrapper(),
    });

    expect(selectors.accessKeySelector()).toHaveValue('ak');
    expect(selectors.secretKeySelector()).toHaveValue(''); // encrypted
    expect(selectors.bucketNameSelector()).toHaveValue('bn');
  });
  it('should call onChange on location details updates', async () => {
    const refLocation = {
      endpoint: 'https://s3.wasabisys.com',
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: false,
    };
    let location = {};
    render(<LocationDetailsWasabi {...props} onChange={(l) => (location = l)} />, {
      wrapper: NewWrapper(),
    });
    await userEvent.type(selectors.accessKeySelector(), 'ak');
    await userEvent.type(selectors.secretKeySelector(), 'sk');
    await userEvent.type(selectors.bucketNameSelector(), 'bn');
    expect(location).toEqual(refLocation);
  });
});
