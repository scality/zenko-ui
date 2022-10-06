/* eslint-disable */
import {
  checkBox,
  themeMount as mount,
  updateInputText,
} from '../../../../utils/test';
import LocationDetailsWasabi from '../LocationDetailsWasabi';
import React from 'react';
const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsWasabi />', () => {
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    mount(<LocationDetailsWasabi {...props} onChange={onChangeFn} />);
    expect(onChangeFn).toHaveBeenCalledWith({
      bucketMatch: false,
      accessKey: '',
      secretKey: '',
      bucketName: '',
      endpoint: 'https://s3.wasabisys.com',
    });
  });
  it('should call onChange on state update', () => {
    const refLocation = {
      bucketMatch: true,
      accessKey: 'ak',
      secretKey: 'sk',
      bucketName: 'bn',
      endpoint: 'https://s3.wasabisys.com',
    };
    const onChangeFn = jest.fn();
    const component = mount(
      <LocationDetailsWasabi {...props} onChange={onChangeFn} />,
    );
    component.find(LocationDetailsWasabi).setState({ ...refLocation }, () => {
      expect(onChangeFn).toHaveBeenCalledWith(refLocation);
    });
  });
  it('should show wasabi details for empty details', () => {
    const component = mount(<LocationDetailsWasabi {...props} />);
    expect(component.find('input[name="accessKey"]')).toHaveLength(1);
    expect(component.find('input[name="accessKey"]').props().value).toEqual('');
    expect(component.find('input[name="secretKey"]')).toHaveLength(1);
    expect(component.find('input[name="secretKey"]').props().value).toEqual('');
    expect(component.find('input[name="bucketName"]')).toHaveLength(1);
    expect(component.find('input[name="bucketName"]').props().value).toEqual(
      '',
    );
    expect(component.find('input[name="endpoint"]')).toHaveLength(1);
    expect(component.find('input[name="endpoint"]').props().value).toEqual(
      'https://s3.wasabisys.com',
    );
  });
  it('should show custom details when editing an existing location', () => {
    const locationDetails = {
      endpoint: 'https://s3.wasabisys.com',
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
    };
    const component = mount(
      <LocationDetailsWasabi {...props} details={locationDetails} />,
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
      'https://s3.wasabisys.com',
    );
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
    const component = mount(
      <LocationDetailsWasabi {...props} onChange={(l) => (location = l)} />,
    );
    updateInputText(component, 'accessKey', 'ak');
    updateInputText(component, 'secretKey', 'sk');
    updateInputText(component, 'bucketName', 'bn');
    updateInputText(component, 'endpoint', 'https://ep');
    expect(location).toEqual(refLocation);
  });
});
