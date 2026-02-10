import userEvent from '@testing-library/user-event';
import { themeMount as mount, updateInputText } from '../../../utils/testUtil';
import LocationDetailsGcp from '../LocationDetailsGcp';

const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsGcp />', () => {
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    //@ts-expect-error fix this when you are working on it
    mount(<LocationDetailsGcp {...props} onChange={onChangeFn} />);
    expect(onChangeFn).toHaveBeenCalledWith({
      bucketMatch: false,
      accessKey: '',
      secretKey: '',
      bucketName: '',
      mpuBucketName: '',
    });
  });
  it('should call onChange on state update', async () => {
    const refLocation = {
      bucketMatch: true,
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      mpuBucketName: 'mbn',
    };
    const onChangeFn = jest.fn();
    const component = mount(
      // @ts-expect-error
      <LocationDetailsGcp {...props} onChange={onChangeFn} />,
    );

    const accessKeyInput = component.getByRole('textbox', {
      name: /access key/i,
    });
    const secretKeyInput = component.container.querySelector('input[name="secretKey"]');
    const bucketNameInput = component.container.querySelector('input[name="bucketName"]');
    const mpuBucketInput = component.container.querySelector('input[name="mpuBucketName"]');

    await userEvent.type(accessKeyInput, 'ak');
    await userEvent.type(secretKeyInput, 'sk');
    await userEvent.type(bucketNameInput, 'bn');
    await userEvent.type(mpuBucketInput, 'mbn');
  });
  it('should show gcp details for empty details', () => {
    //@ts-expect-error fix this when you are working on it
    const component = mount(<LocationDetailsGcp {...props} />);

    expect(component.getByRole('textbox', { name: /access key/i })).toHaveValue('');
    expect(component.container.querySelector('input[name="secretKey"]')).toHaveValue('');
    expect(component.container.querySelector('input[name="bucketName"]')).toHaveValue('');
    expect(component.container.querySelector('input[name="mpuBucketName"]')).toHaveValue('');
  });
  it('should show gcp details when editing an existing location', () => {
    const locationDetails = {
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      mpuBucketName: 'mbn',
      bucketMatch: true,
    };
    const component = mount(
      // @ts-expect-error
      <LocationDetailsGcp {...props} details={locationDetails} />,
    );

    expect(component.getByRole('textbox', { name: /access key/i })).toHaveValue('ak');
    expect(component.container.querySelector('input[name="secretKey"]')).toHaveValue(''); // encrypted
    expect(component.container.querySelector('input[name="bucketName"]')).toHaveValue('bn');
    expect(component.container.querySelector('input[name="mpuBucketName"]')).toHaveValue('mbn');
  });
  it('should call onChange on location details updates', () => {
    const refLocation = {
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      mpuBucketName: 'mbn',
      bucketMatch: false,
    };
    let location = {};
    const { container } = mount(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsGcp {...props} onChange={(l) => (location = l)} />,
    );

    updateInputText(container, 'accessKey', 'ak');
    updateInputText(container, 'secretKey', 'sk');
    updateInputText(container, 'bucketName', 'bn');
    updateInputText(container, 'mpuBucketName', 'mbn');
    expect(location).toEqual(refLocation);
  });
});
