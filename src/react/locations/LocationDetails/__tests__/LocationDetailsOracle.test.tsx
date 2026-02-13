import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Wrapper } from '../../../utils/testUtil';
import LocationDetailsOracle, { SECRET_KEY_PLACEHOLDER } from '../LocationDetailsOracle';
import { ORACLE_CLOUD_LOCATION_KEY } from '../../../../types/config';

const selectors = {
  namespaceSelector: () => screen.getByRole('textbox', { name: /Namespace/ }),
  regionSelector: () => screen.getByRole('textbox', { name: /Region/ }),
  targetBucketSelector: () => screen.getByRole('textbox', { name: /Target Bucket Name/ }),
  accessKeySelector: () => screen.getByRole('textbox', { name: /Access Key/ }),
  secretKeySelector: () => screen.getByPlaceholderText(new RegExp(SECRET_KEY_PLACEHOLDER)),
};

const namespace = 'namespace';
const region = 'eu-paris-1';
const targetBucketName = 'target-bucket';
const accessKey = 'accessKey';
const secretKey = 'secretKey';

describe('LocationDetailsOracle', () => {
  it('should call onChange with the expected props', async () => {
    //S
    const props = {
      details: {},
      onChange: () => {},
      locationType: ORACLE_CLOUD_LOCATION_KEY,
    };
    let location = {};
    render(
      //@ts-ignore
      <LocationDetailsOracle {...props} onChange={(l) => (location = l)} />,
      { wrapper: Wrapper },
    );
    await waitFor(() => {
      expect(selectors.namespaceSelector()).toBeInTheDocument();
    });
    //E
    await userEvent.type(selectors.namespaceSelector(), namespace);
    await userEvent.type(selectors.regionSelector(), region);
    await userEvent.type(selectors.targetBucketSelector(), targetBucketName);
    await userEvent.type(selectors.accessKeySelector(), accessKey);
    await userEvent.type(selectors.secretKeySelector(), secretKey);
    expect(location).toEqual({
      bucketMatch: false,
      endpoint: `https://${namespace}.compat.objectstorage.${region}.oraclecloud.com`,
      bucketName: targetBucketName,
      accessKey: accessKey,
      secretKey: secretKey,
    });
  });
  it('should render the namespace and region while editing', async () => {
    //S
    const editProps = {
      details: {
        endpoint: `https://${namespace}.compat.objectstorage.${region}.oraclecloud.com`,
        bucketName: targetBucketName,
        accessKey: accessKey,
        secretKey: secretKey,
      },
      onChange: () => {},
      locationType: ORACLE_CLOUD_LOCATION_KEY,
    };
    render(
      //@ts-ignore
      <LocationDetailsOracle {...editProps} onChange={(l) => (location = l)} />,
      { wrapper: Wrapper },
    );
    //V
    await waitFor(() => {
      expect(selectors.namespaceSelector()).toHaveValue(namespace);
    });
    expect(selectors.regionSelector()).toHaveValue(region);
  });
});
