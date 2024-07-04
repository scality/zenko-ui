import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Wrapper } from '../../../utils/testUtil';
import LocationDetailsOracle from '../LocationDetailsOracle';
import { ORACLE_CLOUD_LOCATION_KEY } from '../../../../types/config';

const selectors = {
  namespaceSelector: () => screen.getByLabelText(/Namespace/),
  regionSelector: () => screen.getByLabelText(/Region/),
  targetBucketSelector: () => screen.getByLabelText(/Target Bucket Name/),
  accessKeySelector: () => screen.getByLabelText(/Access Key/),
  secretKeySelector: () => screen.getByLabelText(/Secret Key/),
};
const props = {
  details: {},
  onChange: () => {},
  locationType: ORACLE_CLOUD_LOCATION_KEY,
};
const namespace = 'namespace';
const region = 'eu-paris-1';
describe('class <LocationDetailsOracle />', () => {
  it('should call onChange on mount', async () => {
    //S
    let location = {};
    render(
      //@ts-ignore
      <LocationDetailsOracle {...props} onChange={(l) => (location = l)} />,
      { wrapper: Wrapper },
    );
    waitFor(() => {
      expect(selectors.namespaceSelector()).toBeInTheDocument();
    });
    //E
    await userEvent.type(selectors.namespaceSelector(), namespace);
    await userEvent.type(selectors.regionSelector(), region);
    await userEvent.type(selectors.targetBucketSelector(), 'target-bucket');
    await userEvent.type(selectors.accessKeySelector(), 'accessKey');
    await userEvent.type(selectors.secretKeySelector(), 'secretKey');
    expect(location).toEqual({
      bucketMatch: false,
      endpoint: `https://${namespace}.compat.objectstorage.${region}.oraclecloud.com`,
      bucketName: 'target-bucket',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
    });
  });
});
