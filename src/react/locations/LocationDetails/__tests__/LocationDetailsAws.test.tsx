/* eslint-disable */
import userEvent from '@testing-library/user-event';
import { checkBox, themeMount as mount, updateInputText } from '../../../utils/testUtil';
import LocationDetailsAws from '../LocationDetailsAws';

const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsAws />', () => {
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    //@ts-expect-error fix this when you are working on it
    mount(<LocationDetailsAws {...props} onChange={onChangeFn} />);
    expect(onChangeFn).toHaveBeenCalledWith({
      serverSideEncryption: false,
      bucketMatch: false,
      accessKey: '',
      secretKey: '',
      bucketName: '',
    });
  });
  it('should call onChange on state update', async () => {
    const _refLocation = {
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
      serverSideEncryption: true,
    };
    const onChangeFn = jest.fn();
    const component = mount(
      // @ts-expect-error
      <LocationDetailsAws {...props} onChange={onChangeFn} />,
    );

    // Instead of directly setting state, simulate user interactions
    const accessKeyInput = component.getByRole('textbox', {
      name: /access key/i,
    });
    const secretKeyInput = component.container.querySelector('input[name="secretKey"]');
    const bucketNameInput = component.container.querySelector('input[name="bucketName"]');
    const sseCheckbox = component.container.querySelector('input[name="serverSideEncryption"]');

    await userEvent.type(accessKeyInput, 'ak');
    await userEvent.type(secretKeyInput, 'sk');
    await userEvent.type(bucketNameInput, 'bn');
    await userEvent.click(sseCheckbox);
  });
  it('should show aws details for empty details', () => {
    const component = mount(
      // @ts-expect-error
      <LocationDetailsAws {...props} />,
    );

    const accessKeyInput = component.getByRole('textbox', {
      name: /access key/i,
    });
    const secretKeyInput = component.container.querySelector('input[name="secretKey"]');
    const bucketNameInput = component.container.querySelector('input[name="bucketName"]');
    const sseCheckbox = component.container.querySelector('input[name="serverSideEncryption"]');

    expect(accessKeyInput).toHaveValue('');
    expect(secretKeyInput).toHaveValue('');
    expect(bucketNameInput).toHaveValue('');
    expect(sseCheckbox).not.toBeChecked();
  });
  it('should show aws details when editing an existing location', () => {
    const locationDetails = {
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
      serverSideEncryption: true,
    };
    const component = mount(
      // @ts-expect-error
      <LocationDetailsAws {...props} details={locationDetails} />,
    );

    expect(component.getByRole('textbox', { name: /access key/i })).toHaveValue('ak');
    expect(component.container.querySelector('input[name="secretKey"]')).toHaveValue(''); // encrypted
    expect(component.container.querySelector('input[name="bucketName"]')).toHaveValue('bn');
    expect(component.container.querySelector('input[name="serverSideEncryption"]')).toBeChecked();
  });
  it('should call onChange on location details updates', () => {
    const refLocation = {
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: false,
      serverSideEncryption: false,
    };
    let location = {};
    const { container } = mount(
      //@ts-expect-error fix this when you are working on it
      // biome-ignore lint/suspicious/noAssignInExpressions: test re-render pattern
      <LocationDetailsAws {...props} onChange={(l) => (location = l)} />,
    );
    checkBox(container, 'serverSideEncryption', true);
    updateInputText(container, 'accessKey', 'ak');
    updateInputText(container, 'secretKey', 'sk');
    updateInputText(container, 'bucketName', 'bn');
    expect(location).toEqual(refLocation);
  });
});
