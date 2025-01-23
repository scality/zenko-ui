/* eslint-disable */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationDetails } from '../../../../types/config';
import { NewWrapper, updateInputText } from '../../../utils/testUtil';
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
      await userEvent.type(screen.getByLabelText(/access key/i), 'ak');
    });
    await waitFor(async () => {
      await userEvent.type(screen.getByLabelText(/secret key/i), 'sk');
    });
    await waitFor(async () => {
      await userEvent.type(screen.getByLabelText(/bucket name/i), 'bn');
    });
  });
  it('should show wasabi details for empty details', () => {
    render(<LocationDetailsWasabi {...props} />, {
      wrapper: NewWrapper(),
    });

    expect(screen.getByLabelText(/access key/i)).toHaveValue('');
    expect(screen.getByLabelText(/secret key/i)).toHaveValue('');
    expect(screen.getByLabelText(/bucket name/i)).toHaveValue('');
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

    expect(screen.getByLabelText(/access key/i)).toHaveValue('ak');
    expect(screen.getByLabelText(/secret key/i)).toHaveValue(''); // encrypted
    expect(screen.getByLabelText(/bucket name/i)).toHaveValue('bn');
  });
  it('should call onChange on location details updates', () => {
    const refLocation = {
      endpoint: 'https://s3.wasabisys.com',
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: false,
    };
    let location = {};
    const { container } = render(
      <LocationDetailsWasabi {...props} onChange={(l) => (location = l)} />,
      {
        wrapper: NewWrapper(),
      },
    );
    updateInputText(container, 'accessKey', 'ak');
    updateInputText(container, 'secretKey', 'sk');
    updateInputText(container, 'bucketName', 'bn');
    expect(location).toEqual(refLocation);
  });
});
