/* eslint-disable */
import {
  checkBox,
  reduxMountAct,
  updateInputText,
} from '../../../utils/testUtil';
import LocationDetailsAwsCustom from '../LocationDetailsAwsCustom';

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
    //@ts-expect-error fix this when you are working on it
    await reduxMountAct(
      //@ts-expect-error fix this when you are working on it
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
      // @ts-expect-error
      <LocationDetailsAwsCustom {...props} />,
      {},
    );

    expect(component.getByRole('textbox', { name: /access key/i })).toHaveValue(
      '',
    );
    expect(
      component.container.querySelector('input[name="secretKey"]'),
    ).toHaveValue('');
    expect(
      component.container.querySelector('input[name="bucketName"]'),
    ).toHaveValue('');
    expect(
      component.container.querySelector('input[name="endpoint"]'),
    ).toHaveValue('');
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
      // @ts-expect-error
      <LocationDetailsAwsCustom {...props} details={locationDetails} />,
      {},
    );

    expect(component.getByRole('textbox', { name: /access key/i })).toHaveValue(
      'ak',
    );
    expect(
      component.container.querySelector('input[name="secretKey"]'),
    ).toHaveValue(''); // encrypted
    expect(
      component.container.querySelector('input[name="bucketName"]'),
    ).toHaveValue('bn');
    expect(
      component.container.querySelector('input[name="endpoint"]'),
    ).toHaveValue('https://ep');
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
    //@ts-expect-error fix this when you are working on it
    const { container } = await reduxMountAct(
      //@ts-expect-error fix this when you are working on it
      <LocationDetailsAwsCustom {...props} onChange={(l) => (location = l)} />,
    );
    updateInputText(container, 'accessKey', 'ak');
    updateInputText(container, 'secretKey', 'sk');
    updateInputText(container, 'bucketName', 'bn');
    updateInputText(container, 'endpoint', 'https://ep');
    expect(location).toEqual(refLocation);
  });
});
