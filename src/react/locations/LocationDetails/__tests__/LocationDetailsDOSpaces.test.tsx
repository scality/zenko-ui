/* eslint-disable */
import { themeMount as mount, updateInputText } from '../../../utils/testUtil';
import LocationDetailsDOSpaces from '../LocationDetailsDOSpaces';
const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsDOSpaces />', () => {
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    mount(<LocationDetailsDOSpaces {...props} onChange={onChangeFn} />);
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
      endpoint: 'https://ep',
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
    };
    const onChangeFn = jest.fn();
    const component = mount(
      <LocationDetailsDOSpaces {...props} onChange={onChangeFn} />,
    );
    component.find(LocationDetailsDOSpaces).setState({ ...refLocation }, () => {
      expect(onChangeFn).toHaveBeenCalledWith(refLocation);
    });
  });
  it('should show spaces details for empty details', () => {
    const component = mount(<LocationDetailsDOSpaces {...props} />);
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
  it('should show spaces details when editing an existing location', () => {
    const locationDetails = {
      endpoint: 'https://ep',
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
    };
    const component = mount(
      <LocationDetailsDOSpaces {...props} details={locationDetails} />,
    );
    expect(component.find('input[name="accessKey"]')).toHaveLength(1);
    expect(component.find('input[name="accessKey"]').props().value).toEqual(
      'ak',
    );
    expect(component.find('input[name="secretKey"]')).toHaveLength(1);
    // for now we just set it as empty since it's encrypted
    expect(component.find('input[name="secretKey"]').props().value).toEqual('');
    expect(component.find('input[name="bucketName"]')).toHaveLength(1);
    expect(component.find('input[name="bucketName"]').props().value).toEqual(
      'bn',
    );
    expect(component.find('input[name="endpoint"]')).toHaveLength(1);
    expect(component.find('input[name="endpoint"]').props().value).toEqual(
      'https://ep',
    );
  });
  it('should call onChange on location details updates', () => {
    const refLocation = {
      endpoint: 'https://ep',
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: false,
    };
    let location = {};
    const component = mount(
      <LocationDetailsDOSpaces {...props} onChange={(l) => (location = l)} />,
    );
    updateInputText(component, 'accessKey', 'ak');
    updateInputText(component, 'secretKey', 'sk');
    updateInputText(component, 'bucketName', 'bn');
    updateInputText(component, 'endpoint', 'https://ep');
    expect(location).toEqual(refLocation);
  });
});
