/* eslint-disable */
import { themeMount as mount, updateInputText } from '../../../utils/testUtil';
import LocationDetailsGcp from '../LocationDetailsGcp';

const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsGcp />', () => {
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    mount(<LocationDetailsGcp {...props} onChange={onChangeFn} />);
    expect(onChangeFn).toHaveBeenCalledWith({
      bucketMatch: false,
      accessKey: '',
      secretKey: '',
      bucketName: '',
      mpuBucketName: '',
    });
  });
  it('should call onChange on state update', () => {
    const refLocation = {
      bucketMatch: true,
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      mpuBucketName: 'mbn',
    };
    const onChangeFn = jest.fn();
    const component = mount(
      <LocationDetailsGcp {...props} onChange={onChangeFn} />,
    );
    component.find(LocationDetailsGcp).setState({ ...refLocation }, () => {
      expect(onChangeFn).toHaveBeenCalledWith(refLocation);
    });
  });
  it('should show gcp details for empty details', () => {
    const component = mount(<LocationDetailsGcp {...props} />);
    expect(component.find('input[name="accessKey"]')).toHaveLength(1);
    expect(component.find('input[name="accessKey"]').props().value).toEqual('');
    expect(component.find('input[name="secretKey"]')).toHaveLength(1);
    expect(component.find('input[name="secretKey"]').props().value).toEqual('');
    expect(component.find('input[name="bucketName"]')).toHaveLength(1);
    expect(component.find('input[name="bucketName"]').props().value).toEqual(
      '',
    );
    expect(component.find('input[name="mpuBucketName"]')).toHaveLength(1);
    expect(component.find('input[name="mpuBucketName"]').props().value).toEqual(
      '',
    );
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
      <LocationDetailsGcp {...props} details={locationDetails} />,
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
    expect(component.find('input[name="mpuBucketName"]')).toHaveLength(1);
    expect(component.find('input[name="mpuBucketName"]').props().value).toEqual(
      'mbn',
    );
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
    const component = mount(
      <LocationDetailsGcp {...props} onChange={(l) => (location = l)} />,
    );

    updateInputText(component, 'accessKey', 'ak');
    updateInputText(component, 'secretKey', 'sk');
    updateInputText(component, 'bucketName', 'bn');
    updateInputText(component, 'mpuBucketName', 'mbn');
    expect(location).toEqual(refLocation);
  });
});
