/* eslint-disable */
import {
  checkBox,
  themeMount as mount,
  updateInputText,
} from '../../../../utils/test';
import LocationDetailsAws from '../LocationDetailsAws';
const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsAws />', () => {
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    mount(<LocationDetailsAws {...props} onChange={onChangeFn} />);
    expect(onChangeFn).toHaveBeenCalledWith({
      serverSideEncryption: false,
      bucketMatch: false,
      accessKey: '',
      secretKey: '',
      bucketName: '',
    });
  });
  it('should call onChange on state update', () => {
    const refLocation = {
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
      serverSideEncryption: true,
    };
    const onChangeFn = jest.fn();
    const component = mount(
      <LocationDetailsAws {...props} onChange={onChangeFn} />,
    );
    component.find(LocationDetailsAws).setState({ ...refLocation }, () => {
      expect(onChangeFn).toHaveBeenCalledWith(refLocation);
    });
  });
  it('should show aws details for empty details', () => {
    const component = mount(<LocationDetailsAws {...props} />);
    expect(component.find('input[name="accessKey"]')).toHaveLength(1);
    expect(component.find('input[name="accessKey"]').props().value).toEqual('');
    expect(component.find('input[name="secretKey"]')).toHaveLength(1);
    expect(component.find('input[name="secretKey"]').props().value).toEqual('');
    expect(component.find('input[name="bucketName"]')).toHaveLength(1);
    expect(component.find('input[name="bucketName"]').props().value).toEqual(
      '',
    );
    expect(component.find('input[name="serverSideEncryption"]')).toHaveLength(
      1,
    );
    expect(
      component.find('input[name="serverSideEncryption"]').props().value,
    ).toEqual(false);
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
      <LocationDetailsAws {...props} details={locationDetails} />,
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
    expect(component.find('input[name="serverSideEncryption"]')).toHaveLength(
      1,
    );
    expect(
      component.find('input[name="serverSideEncryption"]').props().value,
    ).toEqual(true);
  });
  it('should call onChange on location details updates', () => {
    const refLocation = {
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: false,
      serverSideEncryption: true,
    };
    let location = {};
    const component = mount(
      <LocationDetailsAws {...props} onChange={(l) => (location = l)} />,
    );
    checkBox(component, 'serverSideEncryption', true);
    updateInputText(component, 'accessKey', 'ak');
    updateInputText(component, 'secretKey', 'sk');
    updateInputText(component, 'bucketName', 'bn');
    expect(location).toEqual(refLocation);
  });
});
