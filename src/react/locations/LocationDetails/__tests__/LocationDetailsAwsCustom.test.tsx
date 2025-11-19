/* eslint-disable */
import userEvent from '@testing-library/user-event';
import { JAGUAR_S3_LOCATION_KEY } from '../../../../types/config';
import { InstanceStateSnapshot } from '../../../../types/stats';
import {
  NewWrapper,
  reduxMountAct,
  updateInputText,
} from '../../../utils/testUtil';
import LocationDetailsAwsCustom from '../LocationDetailsAwsCustom';
import { debug } from 'jest-preview';

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
  it('should display truststore link for non-Ring S3 Reseller locations and an HTTPS endpoint', async () => {
    const component = await reduxMountAct(
      <LocationDetailsAwsCustom
        {...props}
        locationType="location-scality-artesca-s3-v1"
        details={{
          endpoint: 'https://ep',
        }}
        capabilities={
          {
            capabilities: {
              locationTypeS3Custom: true,
            },
          } as Pick<InstanceStateSnapshot, 'capabilities'>
        }
      />,
      {
        wrapper: NewWrapper(),
      },
    );

    expect(
      component.getByText(/Certificate for HTTPS Endpoint/i),
    ).toBeInTheDocument();

    const truststoreLink = component.getByRole('link', {
      name: /open truststore/i,
    });
    expect(truststoreLink).toHaveAttribute('href', '/data/truststore');
    expect(truststoreLink).toHaveAttribute('target', '_blank');
  });
  it('should not display truststore link for Ring S3 Reseller locations', async () => {
    const component = await reduxMountAct(
      <LocationDetailsAwsCustom
        {...props}
        locationType={JAGUAR_S3_LOCATION_KEY}
        capabilities={
          {
            capabilities: {
              locationTypeS3Custom: true,
            },
          } as Pick<InstanceStateSnapshot, 'capabilities'>
        }
      />,
      {
        wrapper: NewWrapper(),
      },
    );
    expect(
      component.queryByText(/when using an https endpoint/i),
    ).not.toBeInTheDocument();
  });
});
