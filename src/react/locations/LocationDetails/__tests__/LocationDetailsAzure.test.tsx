/* eslint-disable */
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import {
  reduxRender,
  themeMount as mount,
  selectClick,
} from '../../../utils/testUtil';

import LocationDetailsAzure from '../LocationDetailsAzure';
const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsAzure />', () => {
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
    } = reduxRender(
      <LocationDetailsAzure
        locationType="location-azure-v1"
        //@ts-expect-error
        details={details || {}}
        onChange={onChange}
      />,
      {},
    );
    const endpoint = 'https://ep';
    const targetBucket = 'targetBucket';
    return { onChange, container, endpoint, targetBucket };
  };

  it('should show azure details for empty details', () => {
    //S
    setupAndRenderLocationDetails();

    //V
    expect(screen.getByLabelText(/Blob Endpoint/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blob Endpoint/i)).toHaveValue('');

    expect(screen.getByLabelText(/Target Container Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Container Name/i)).toHaveValue('');

    expect(screen.getByLabelText(/Storage Account Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Storage Account Name/i)).toHaveValue('');

    expect(screen.getByLabelText(/Storage Account Key/i)).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(screen.getByLabelText(/Storage Account Key/i)).toHaveValue('');
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
    expect(screen.getByLabelText(/Blob Endpoint/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blob Endpoint/i)).toHaveValue(
      locationDetails.endpoint,
    );

    expect(screen.getByLabelText(/Target Container Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Container Name/i)).toHaveValue(
      locationDetails.bucketName,
    );

    expect(screen.getByLabelText(/Storage Account Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Storage Account Name/i)).toHaveValue(
      locationDetails.accessKey,
    );

    expect(screen.getByLabelText(/Storage Account Key/i)).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(screen.getByLabelText(/Storage Account Key/i)).toHaveValue('');
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
    expect(screen.getByLabelText(/Blob Endpoint/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blob Endpoint/i)).toHaveValue(
      locationDetails.endpoint,
    );

    expect(screen.getByLabelText(/Target Container Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Container Name/i)).toHaveValue(
      locationDetails.bucketName,
    );

    expect(screen.getByLabelText(/Storage Account Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Storage Account Name/i)).toHaveValue(
      locationDetails.auth.accountName,
    );

    expect(screen.getByLabelText(/Storage Account Key/i)).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(screen.getByLabelText(/Storage Account Key/i)).toHaveValue('');
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
    expect(screen.getByLabelText(/Blob Endpoint/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blob Endpoint/i)).toHaveValue(
      locationDetails.endpoint,
    );

    expect(screen.getByLabelText(/Target Container Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Container Name/i)).toHaveValue(
      locationDetails.bucketName,
    );

    expect(screen.getByLabelText(/Client ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Client ID/i)).toHaveValue(
      locationDetails.auth.clientId,
    );

    expect(screen.getByLabelText(/Client Secret/i)).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(screen.getByLabelText(/Client Secret/i)).toHaveValue('');
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
    expect(screen.getByLabelText(/Blob Endpoint/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Blob Endpoint/i)).toHaveValue(
      locationDetails.endpoint,
    );

    expect(screen.getByLabelText(/Target Container Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Container Name/i)).toHaveValue(
      locationDetails.bucketName,
    );

    expect(screen.getByLabelText(/SAS token/i)).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(screen.getByLabelText(/SAS token/i)).toHaveValue('');
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
    await userEvent.type(screen.getByLabelText(/Blob Endpoint/i), endpoint);
    await userEvent.type(
      screen.getByLabelText(/Target Container Name/i),
      targetBucket,
    );

    const selector = notFalsyTypeGuard(
      container.querySelector('.sc-select__control'),
    );
    await selectClick(selector);
    await userEvent.keyboard('{arrowup}');

    expect(
      container.querySelector('.sc-select__option--is-focused')?.textContent,
    ).toBe('Azure Shared Key');

    ['Azure Client Secret', 'Azure Shared Access Signature'].forEach(
      (locationName) => {
        fireEvent.keyDown(selector, {
          key: 'ArrowDown',
          which: 40,
          keyCode: 40,
        });
        expect(
          container.querySelector('.sc-select__option--is-focused')
            ?.textContent,
        ).toBe(locationName);
      },
    );
    return { selector };
  };

  it('should call onChange with expected location when seting auth type to location-azure-shared-key', async () => {
    //S
    const { container, endpoint, onChange, targetBucket } =
      setupAndRenderLocationDetails();
    const accountName = 'name';
    const accountKey = 'key';
    //E
    await setCommonValuesAndPerformCommonChecksOnAuthType({
      container,
      endpoint,
      targetBucket,
    });
    await userEvent.type(
      screen.getByLabelText(/Storage Account Name/i),
      accountName,
    );
    await userEvent.type(
      screen.getByLabelText(/Storage Account Key/i),
      accountKey,
    );
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
    const { container, endpoint, onChange, targetBucket } =
      setupAndRenderLocationDetails();
    const clientId = 'id';
    const clientKey = 'key';
    const tenantId = 'tenanid';
    //E
    await setCommonValuesAndPerformCommonChecksOnAuthType({
      container,
      endpoint,
      targetBucket,
    });
    await userEvent.click(screen.getByText(/Azure Client Secret/i));
    await userEvent.type(screen.getByLabelText(/Tenant ID/i), tenantId);
    await userEvent.type(screen.getByLabelText(/Client ID/i), clientId);
    await userEvent.type(screen.getByLabelText(/Client Secret/i), clientKey);
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
    const { container, endpoint, onChange, targetBucket } =
      setupAndRenderLocationDetails();
    const sasToken = 'token';
    //E
    const { selector } = await setCommonValuesAndPerformCommonChecksOnAuthType({
      container,
      endpoint,
      targetBucket,
    });
    fireEvent.keyDown(selector, { key: 'ArrowDown', which: 40, keyCode: 40 });
    await userEvent.click(screen.getByText(/Azure Shared Access Signature/i));
    await userEvent.type(screen.getByLabelText(/SAS token/i), sasToken);
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
