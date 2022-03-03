/* eslint-disable */
import {
  checkBox,
  reduxMountAct,
  updateInputText,
} from '../../../../utils/test';
import LocationDetailsAwsCustom from '../LocationDetailsAwsCustom';
import React from 'react';
const props = {
  details: {},
  onChange: () => {},
  locationType: 'location-scality-ring-s3-v1',
  capabilities: {
    locationTypeLocal: true,
    locationTypeCephRadosGW: true,
    locationTypeDigitalOcean: true,
    locationTypeS3Custom: true,
    locationTypeSproxyd: true,
    locationTypeHyperdriveV2: true,
    locationTypeNFS: true,
  },
};
describe('class <LocationDetailsAwsCustom />', () => {
  it('should call onChange on mount', async () => {
    const onChangeFn = jest.fn();
    await reduxMountAct(
      <LocationDetailsAwsCustom {...props} onChange={onChangeFn} />,
    );
    expect(onChangeFn).toHaveBeenCalledWith({
      bucketMatch: false,
      accessKey: '',
      secretKey: '',
      bucketName: '',
      endpoint: '',
    });
  });
  it('should show custom details for empty details', async () => {
    const component = await reduxMountAct(
      <LocationDetailsAwsCustom {...props} />,
    );
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
    expect(component.find('input[name="bucketMatch"]')).toHaveLength(1);
    expect(component.find('input[name="bucketMatch"]').props().value).toEqual(
      false,
    );
  });
  it('should show custom details when editing an existing location', async () => {
    const locationDetails = {
      endpoint: 'https://ep',
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
    };
    const component = await reduxMountAct(
      <LocationDetailsAwsCustom {...props} details={locationDetails} />,
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
    expect(component.find('input[name="bucketMatch"]')).toHaveLength(1);
    expect(component.find('input[name="bucketMatch"]').props().value).toEqual(
      true,
    );
  });
  it('should call onChange on location details updates', async () => {
    const refLocation = {
      endpoint: 'https://ep',
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
    };
    let location = {};
    const component = await reduxMountAct(
      <LocationDetailsAwsCustom {...props} onChange={(l) => (location = l)} />,
    );
    checkBox(component, 'bucketMatch', true);
    updateInputText(component, 'accessKey', 'ak');
    updateInputText(component, 'secretKey', 'sk');
    updateInputText(component, 'bucketName', 'bn');
    updateInputText(component, 'endpoint', 'https://ep');
    expect(location).toEqual(refLocation);
  });
});
