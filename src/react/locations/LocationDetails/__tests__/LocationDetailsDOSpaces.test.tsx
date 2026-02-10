/* eslint-disable */
import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { themeMount as mount } from '../../../utils/testUtil';
import LocationDetailsDOSpaces from '../LocationDetailsDOSpaces';

const props = {
  details: {},
  onChange: () => {},
  locationType: 'location-do-spaces-v1',
  editingExisting: false,
};
describe('class <LocationDetailsDOSpaces />', () => {
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    //@ts-expect-error fix this when you are working on it
    mount(<LocationDetailsDOSpaces {...props} onChange={onChangeFn} />);
    expect(onChangeFn).toHaveBeenCalledWith({
      bucketMatch: false,
      accessKey: '',
      secretKey: '',
      bucketName: '',
      endpoint: '',
    });
  });
  it('should call onChange on state update', async () => {
    const refLocation = {
      endpoint: 'https://ep',
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
    };
    const onChangeFn = jest.fn();
    const { container } = mount(
      // @ts-expect-error
      <LocationDetailsDOSpaces {...props} onChange={onChangeFn} />,
    );

    const accessKeyInput = screen.getByRole('textbox', {
      name: /access key/i,
    });
    const secretKeyInput = container.querySelector('input[name="secretKey"]');
    const bucketNameInput = container.querySelector('input[name="bucketName"]');
    const endpointInput = screen.getByRole('textbox', { name: /endpoint/i });

    await userEvent.type(accessKeyInput, 'ak');
    await userEvent.type(secretKeyInput, 'sk');
    await userEvent.type(bucketNameInput, 'bn');
    await userEvent.type(endpointInput, 'https://ep');
  });
  it('should show spaces details for empty details', () => {
    //@ts-expect-error fix this when you are working on it
    const { container } = mount(<LocationDetailsDOSpaces {...props} />);

    expect(screen.getByRole('textbox', { name: /access key/i })).toHaveValue('');
    expect(container.querySelector('input[name="secretKey"]')).toHaveValue('');
    expect(container.querySelector('input[name="bucketName"]')).toHaveValue('');
    expect(screen.getByRole('textbox', { name: /endpoint/i })).toHaveValue('');
  });
  it('should show spaces details when editing an existing location', () => {
    const locationDetails = {
      endpoint: 'https://ep',
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
    };
    const { container } = mount(
      // @ts-expect-error
      <LocationDetailsDOSpaces {...props} details={locationDetails} />,
    );

    expect(screen.getByRole('textbox', { name: /access key/i })).toHaveValue('ak');
    expect(container.querySelector('input[name="secretKey"]')).toHaveValue(''); // encrypted
    expect(container.querySelector('input[name="bucketName"]')).toHaveValue('bn');
    expect(screen.getByRole('textbox', { name: /endpoint/i })).toHaveValue('https://ep');
  });
  it('should call onChange on location details updates', async () => {
    const refLocation = {
      endpoint: 'https://ep',
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: false,
    };
    let location = {};
    const { container } = mount(
      // @ts-expect-error
      <LocationDetailsDOSpaces {...props} onChange={(l) => (location = l)} />,
    );

    const accessKeyInput = screen.getByRole('textbox', {
      name: /access key/i,
    });
    const secretKeyInput = container.querySelector('input[name="secretKey"]');
    const bucketNameInput = container.querySelector('input[name="bucketName"]');
    const endpointInput = screen.getByRole('textbox', { name: /endpoint/i });

    await userEvent.type(accessKeyInput, 'ak');
    await userEvent.type(secretKeyInput, 'sk');
    await userEvent.type(bucketNameInput, 'bn');
    await userEvent.type(endpointInput, 'https://ep');
  });
});
