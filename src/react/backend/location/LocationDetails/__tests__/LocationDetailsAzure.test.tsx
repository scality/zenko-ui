/* eslint-disable */
import { themeMount as mount, updateInputText } from '../../../../utils/test';
import LocationDetailsAzure from '../LocationDetailsAzure';
const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsAzure />', () => {
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    mount(<LocationDetailsAzure {...props} onChange={onChangeFn} />);
    expect(onChangeFn).toHaveBeenCalledWith({
      bucketMatch: false,
      accessKey: '',
      secretKey: '',
      bucketName: '',
      endpoint: '',
    });
  });
  it('should call onChange on state update', () => {
    const refLocation = {
      bucketMatch: false,
      accessKey: 'ak',
      secretKey: 'sk',
      bucketName: 'bn',
      endpoint: 'https://ep',
    };
    const onChangeFn = jest.fn();
    const component = mount(
      <LocationDetailsAzure {...props} onChange={onChangeFn} />,
    );
    component.find(LocationDetailsAzure).setState({ ...refLocation }, () => {
      expect(onChangeFn).toHaveBeenCalledWith(refLocation);
    });
  });
  it('should show azure details for empty details', () => {
    const component = mount(<LocationDetailsAzure {...props} />);
    expect(component.find('input[name="accessKey"]')).toHaveLength(1);
    expect(component.find('input[name="accessKey"]').props().value).toEqual('');
    expect(component.find('input[name="secretKey"]')).toHaveLength(1);
    expect(component.find('input[name="secretKey"]').props().value).toEqual('');
    expect(component.find('input[name="bucketName"]')).toHaveLength(1);
    expect(component.find('input[name="bucketName"]').props().value).toEqual(
      '',
    );
    expect(component.find('input[name="endpoint"]')).toHaveLength(1);
    expect(component.find('input[name="endpoint"]').props().value).toEqual('');
  });
  it('should show azure details when editing an existing location', () => {
    const locationDetails = {
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
      endpoint: 'https://ep',
    };
    const component = mount(
      <LocationDetailsAzure {...props} details={locationDetails} />,
    );
    expect(component.find('input[name="accessKey"]')).toHaveLength(1);
    expect(component.find('input[name="accessKey"]').props().value).toEqual(
      'ak',
    );
    expect(component.find('input[name="endpoint"]')).toHaveLength(1);
    expect(component.find('input[name="endpoint"]').props().value).toEqual(
      'https://ep',
    );
    expect(component.find('input[name="secretKey"]')).toHaveLength(1);
    // for now we just set it as empty since it's encrypted
    expect(component.find('input[name="secretKey"]').props().value).toEqual('');
    expect(component.find('input[name="bucketName"]')).toHaveLength(1);
    expect(component.find('input[name="bucketName"]').props().value).toEqual(
      'bn',
    );
  });
  it('should call onChange on location details updates', () => {
    const refLocation = {
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: false,
      endpoint: 'https://ep',
    };
    let location = {};
    const component = mount(
      <LocationDetailsAzure {...props} onChange={(l) => (location = l)} />,
    );
    updateInputText(component, 'accessKey', 'ak');
    updateInputText(component, 'secretKey', 'sk');
    updateInputText(component, 'bucketName', 'bn');
    updateInputText(component, 'endpoint', 'https://ep');
    expect(location).toEqual(refLocation);
  });
});
