/* eslint-disable */
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { themeMount as mount, selectClick, testRender } from '../../../utils/testUtil';

import LocationDetailsAzure from '../LocationDetailsAzure';

const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsAzure />', () => {
  const selectors = {
    blobEndpoint: () => screen.getByRole('textbox', { name: /Blob Endpoint/i }),
    targetContainerName: () => screen.getByRole('textbox', { name: /Target Container Name/i }),
    storageAccountName: () => screen.getByRole('textbox', { name: /Storage Account Name/i }),
    storageAccountKey: () => screen.getByPlaceholderText(/AccountKey/i),
    clientId: () => screen.getByRole('textbox', { name: /Client ID/i }),
    clientSecret: () => screen.getByPlaceholderText(/ClientKey/i),
    tenantId: () => screen.getByRole('textbox', { name: /Tenant ID/i }),
    sasToken: () => screen.getByRole('textbox', { name: /SAS token/i }),
    azureClientSecret: () => screen.getByText(/Azure Client Secret/i),
    azureSharedAccessSignature: () => screen.getByText(/Azure Shared Access Signature/i),
  };
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
    //@ts-expect-error fix this when you are working on it
    mount(<LocationDetailsAzure {...props} onChange={onChangeFn} />);
    expect(onChangeFn).toHaveBeenCalledWith({
      bucketMatch: false,
      auth: {
        type: 'location-azure-shared-key',
        accountName: '',
        accountKey: '',
      },
      bucketName: '',
      endpoint: '',
    });
  });

  const setupAndRenderLocationDetails = (details?: LocationDetailsAzure) => {
    const onChange = jest.fn();
    const {
      component: { container },
    } = testRender(
      <LocationDetailsAzure
        locationType="location-azure-v1"
        //@ts-expect-error
        details={details || {}}
        onChange={onChange}
      />,
    );
    const endpoint = 'https://ep';
    const targetBucket = 'targetBucket';
    return { onChange, container, endpoint, targetBucket };
  };

  it('should show azure details for empty details', () => {
    //S
    setupAndRenderLocationDetails();

    //V
    expect(selectors.blobEndpoint()).toBeInTheDocument();
    expect(selectors.blobEndpoint()).toHaveValue('');

    expect(selectors.targetContainerName()).toBeInTheDocument();
    expect(selectors.targetContainerName()).toHaveValue('');

    expect(selectors.storageAccountName()).toBeInTheDocument();
    expect(selectors.storageAccountName()).toHaveValue('');

    expect(selectors.storageAccountKey()).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(selectors.storageAccountKey()).toHaveValue('');
  });
  it('should show azure details when editing an existing location', () => {
    //S
    const locationDetails = {
      secretKey: 'sk',
      accessKey: 'ak',
      bucketName: 'bn',
      bucketMatch: true,
      endpoint: 'https://ep',
    };
    //@ts-expect-error fix this when you are working on it
    setupAndRenderLocationDetails(locationDetails);

    //V
    expect(selectors.blobEndpoint()).toBeInTheDocument();
    expect(selectors.blobEndpoint()).toHaveValue(locationDetails.endpoint);

    expect(selectors.targetContainerName()).toBeInTheDocument();
    expect(selectors.targetContainerName()).toHaveValue(locationDetails.bucketName);

    expect(selectors.storageAccountName()).toBeInTheDocument();
    expect(selectors.storageAccountName()).toHaveValue(locationDetails.accessKey);

    expect(selectors.storageAccountKey()).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(selectors.storageAccountKey()).toHaveValue('');
  });
  it('should show azure details when editing an existing location with auth type location-azure-shared-key', () => {
    //S
    const locationDetails = {
      bucketName: 'bn',
      bucketMatch: true,
      endpoint: 'https://ep',
      auth: {
        type: 'location-azure-shared-key',
        accountName: 'name',
        accountKey: 'key',
      },
    };
    //@ts-expect-error fix this when you are working on it
    setupAndRenderLocationDetails(locationDetails);

    //V
    expect(selectors.blobEndpoint()).toBeInTheDocument();
    expect(selectors.blobEndpoint()).toHaveValue(locationDetails.endpoint);

    expect(selectors.targetContainerName()).toBeInTheDocument();
    expect(selectors.targetContainerName()).toHaveValue(locationDetails.bucketName);

    expect(selectors.storageAccountName()).toBeInTheDocument();
    expect(selectors.storageAccountName()).toHaveValue(locationDetails.auth.accountName);

    expect(selectors.storageAccountKey()).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(selectors.storageAccountKey()).toHaveValue('');
  });

  it('should show azure details when editing an existing location with auth type location-azure-client-secret', () => {
    //S
    const locationDetails = {
      bucketName: 'bn',
      bucketMatch: true,
      endpoint: 'https://ep',
      auth: {
        type: 'location-azure-client-secret',
        clientId: 'id',
        clientKey: 'key',
        tenantId: 'tenantId',
      },
    };
    //@ts-expect-error fix this when you are working on it
    setupAndRenderLocationDetails(locationDetails);

    //V
    expect(selectors.blobEndpoint()).toBeInTheDocument();
    expect(selectors.blobEndpoint()).toHaveValue(locationDetails.endpoint);

    expect(selectors.targetContainerName()).toBeInTheDocument();
    expect(selectors.targetContainerName()).toHaveValue(locationDetails.bucketName);

    expect(selectors.clientId()).toBeInTheDocument();
    expect(selectors.clientId()).toHaveValue(locationDetails.auth.clientId);

    expect(selectors.clientSecret()).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(selectors.clientSecret()).toHaveValue('');
  });

  it('should show azure details when editing an existing location with auth type location-azure-shared-access-signature', () => {
    //S
    const locationDetails = {
      bucketName: 'bn',
      bucketMatch: true,
      endpoint: 'https://ep',
      auth: {
        type: 'location-azure-shared-access-signature',
        storageSasToken: 'token',
      },
    };
    //@ts-expect-error fix this when you are working on it
    setupAndRenderLocationDetails(locationDetails);

    //V
    expect(selectors.blobEndpoint()).toBeInTheDocument();
    expect(selectors.blobEndpoint()).toHaveValue(locationDetails.endpoint);

    expect(selectors.targetContainerName()).toBeInTheDocument();
    expect(selectors.targetContainerName()).toHaveValue(locationDetails.bucketName);

    expect(selectors.sasToken()).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(selectors.sasToken()).toHaveValue('');
  });

  const setCommonValuesAndPerformCommonChecksOnAuthType = async ({
    endpoint,
    targetBucket,
    container,
  }: {
    endpoint: string;
    targetBucket: string;
    container: HTMLElement;
  }) => {
    await userEvent.type(selectors.blobEndpoint(), endpoint);
    await userEvent.type(selectors.targetContainerName(), targetBucket);

    const selector = notFalsyTypeGuard(container.querySelector('.sc-select__control'));
    await selectClick(selector);
    await userEvent.keyboard('{arrowup}');

    expect(container.querySelector('.sc-select__option--is-focused')?.textContent).toBe('Azure Shared Key');

    ['Azure Client Secret', 'Azure Shared Access Signature'].forEach((locationName) => {
      fireEvent.keyDown(selector, {
        key: 'ArrowDown',
        which: 40,
        keyCode: 40,
      });
      expect(container.querySelector('.sc-select__option--is-focused')?.textContent).toBe(locationName);
    });
    return { selector };
  };

  it('should call onChange with expected location when seting auth type to location-azure-shared-key', async () => {
    //S
    const { container, endpoint, onChange, targetBucket } = setupAndRenderLocationDetails();
    const accountName = 'name';
    const accountKey = 'key';
    //E
    await setCommonValuesAndPerformCommonChecksOnAuthType({
      container,
      endpoint,
      targetBucket,
    });
    await userEvent.type(selectors.storageAccountName(), accountName);
    await userEvent.type(selectors.storageAccountKey(), accountKey);
    //V

    expect(onChange).toHaveBeenCalledWith({
      bucketMatch: false,
      endpoint,
      auth: {
        type: 'location-azure-shared-key',
        accountName,
        accountKey,
      },
      bucketName: targetBucket,
    });
  });

  it('should call onChange with expected location when seting auth type to location-azure-client-secret', async () => {
    //S
    const { container, endpoint, onChange, targetBucket } = setupAndRenderLocationDetails();
    const clientId = 'id';
    const clientKey = 'key';
    const tenantId = 'tenanid';
    //E
    await setCommonValuesAndPerformCommonChecksOnAuthType({
      container,
      endpoint,
      targetBucket,
    });
    await userEvent.click(selectors.azureClientSecret());
    await userEvent.type(selectors.tenantId(), tenantId);
    await userEvent.type(selectors.clientId(), clientId);
    await userEvent.type(selectors.clientSecret(), clientKey);
    //V
    expect(onChange).toHaveBeenCalledWith({
      bucketMatch: false,
      endpoint,
      auth: {
        type: 'location-azure-client-secret',
        clientId,
        clientKey,
        tenantId,
      },
      bucketName: targetBucket,
    });
  });

  it('should call onChange with expected location when seting auth type to location-azure-shared-access-signature', async () => {
    //S
    const { container, endpoint, onChange, targetBucket } = setupAndRenderLocationDetails();
    const sasToken = 'token';
    //E
    const { selector } = await setCommonValuesAndPerformCommonChecksOnAuthType({
      container,
      endpoint,
      targetBucket,
    });
    fireEvent.keyDown(selector, { key: 'ArrowDown', which: 40, keyCode: 40 });
    await userEvent.click(selectors.azureSharedAccessSignature());
    await userEvent.type(selectors.sasToken(), sasToken);
    //V
    expect(onChange).toHaveBeenCalledWith({
      bucketMatch: false,
      endpoint,
      auth: {
        type: 'location-azure-shared-access-signature',
        storageSasToken: sasToken,
      },
      bucketName: targetBucket,
    });
  });
});
