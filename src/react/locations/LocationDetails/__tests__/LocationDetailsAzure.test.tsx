/* eslint-disable */
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notFalsyTypeGuard } from '../../../../types/typeGuards';
import { reduxRender, themeMount as mount } from '../../../utils/testUtil';
import LocationDetailsAzure from '../LocationDetailsAzure';
const props = {
  details: {},
  onChange: () => {},
};
describe('class <LocationDetailsAzure />', () => {
  it('should call onChange on mount', () => {
    const onChangeFn = jest.fn();
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
    expect(
      screen.getByLabelText(/Azure Storage Endpoint/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Azure Storage Endpoint/i)).toHaveValue('');

    expect(
      screen.getByLabelText(/Target Azure Container Name/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Azure Container Name/i)).toHaveValue(
      '',
    );

    expect(screen.getByLabelText(/Azure Account Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Azure Account Name/i)).toHaveValue('');

    expect(screen.getByLabelText(/Azure Account Key/i)).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(screen.getByLabelText(/Azure Account Key/i)).toHaveValue('');
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
    setupAndRenderLocationDetails(locationDetails);

    //V
    expect(
      screen.getByLabelText(/Azure Storage Endpoint/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Azure Storage Endpoint/i)).toHaveValue(
      locationDetails.endpoint,
    );

    expect(
      screen.getByLabelText(/Target Azure Container Name/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Azure Container Name/i)).toHaveValue(
      locationDetails.bucketName,
    );

    expect(screen.getByLabelText(/Azure Account Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Azure Account Name/i)).toHaveValue(
      locationDetails.accessKey,
    );

    expect(screen.getByLabelText(/Azure Account Key/i)).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(screen.getByLabelText(/Azure Account Key/i)).toHaveValue('');
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
    setupAndRenderLocationDetails(locationDetails);

    //V
    expect(
      screen.getByLabelText(/Azure Storage Endpoint/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Azure Storage Endpoint/i)).toHaveValue(
      locationDetails.endpoint,
    );

    expect(
      screen.getByLabelText(/Target Azure Container Name/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Azure Container Name/i)).toHaveValue(
      locationDetails.bucketName,
    );

    expect(screen.getByLabelText(/Azure Account Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Azure Account Name/i)).toHaveValue(
      locationDetails.auth.accountName,
    );

    expect(screen.getByLabelText(/Azure Account Key/i)).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(screen.getByLabelText(/Azure Account Key/i)).toHaveValue('');
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
      },
    };
    setupAndRenderLocationDetails(locationDetails);

    //V
    expect(
      screen.getByLabelText(/Azure Storage Endpoint/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Azure Storage Endpoint/i)).toHaveValue(
      locationDetails.endpoint,
    );

    expect(
      screen.getByLabelText(/Target Azure Container Name/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Azure Container Name/i)).toHaveValue(
      locationDetails.bucketName,
    );

    expect(screen.getByLabelText(/Azure Client Id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Azure Client Id/i)).toHaveValue(
      locationDetails.auth.clientId,
    );

    expect(screen.getByLabelText(/Azure Client Key/i)).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(screen.getByLabelText(/Azure Client Key/i)).toHaveValue('');
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
    setupAndRenderLocationDetails(locationDetails);

    //V
    expect(
      screen.getByLabelText(/Azure Storage Endpoint/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Azure Storage Endpoint/i)).toHaveValue(
      locationDetails.endpoint,
    );

    expect(
      screen.getByLabelText(/Target Azure Container Name/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Azure Container Name/i)).toHaveValue(
      locationDetails.bucketName,
    );

    expect(
      screen.getByLabelText(/Azure Storage Sas Token/i),
    ).toBeInTheDocument();
    // for now we just set it as empty since it's encrypted
    expect(screen.getByLabelText(/Azure Storage Sas Token/i)).toHaveValue('');
  });

  const setCommonValuesAndPerformCommonChecksOnAuthType = ({
    endpoint,
    targetBucket,
    container,
  }: {
    endpoint: string;
    targetBucket: string;
    container: HTMLElement;
  }) => {
    userEvent.type(screen.getByLabelText(/Azure Storage Endpoint/i), endpoint);
    userEvent.type(
      screen.getByLabelText(/Target Azure Container Name/i),
      targetBucket,
    );

    const selector = notFalsyTypeGuard(
      container.querySelector('.sc-select__control'),
    );
    userEvent.click(selector);

    fireEvent.keyDown(selector, { key: 'ArrowDown', which: 40, keyCode: 40 });
    fireEvent.keyDown(selector, { key: 'ArrowUp', which: 38, keyCode: 38 });
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

  it('should call onChange with expected location when seting auth type to location-azure-shared-key', () => {
    //S
    const { container, endpoint, onChange, targetBucket } =
      setupAndRenderLocationDetails();
    const accountName = 'name';
    const accountKey = 'key';
    //E
    setCommonValuesAndPerformCommonChecksOnAuthType({
      container,
      endpoint,
      targetBucket,
    });

    userEvent.type(screen.getByLabelText(/Azure Account Name/i), accountName);
    userEvent.type(screen.getByLabelText(/Azure Account Key/i), accountKey);
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

  it('should call onChange with expected location when seting auth type to location-azure-client-secret', () => {
    //S
    const { container, endpoint, onChange, targetBucket } =
      setupAndRenderLocationDetails();
    const clientId = 'id';
    const clientKey = 'key';
    //E
    setCommonValuesAndPerformCommonChecksOnAuthType({
      container,
      endpoint,
      targetBucket,
    });
    userEvent.click(screen.getByText(/Azure Client Secret/i));
    userEvent.type(screen.getByLabelText(/Azure Client Id/i), clientId);
    userEvent.type(screen.getByLabelText(/Azure Client Key/i), clientKey);
    //V
    expect(onChange).toHaveBeenCalledWith({
      bucketMatch: false,
      endpoint,
      auth: {
        type: 'location-azure-client-secret',
        clientId,
        clientKey,
      },
      bucketName: targetBucket,
    });
  });

  it('should call onChange with expected location when seting auth type to location-azure-shared-access-signature', () => {
    //S
    const { container, endpoint, onChange, targetBucket } =
      setupAndRenderLocationDetails();
    const sasToken = 'token';
    //E
    const { selector } = setCommonValuesAndPerformCommonChecksOnAuthType({
      container,
      endpoint,
      targetBucket,
    });
    fireEvent.keyDown(selector, { key: 'ArrowDown', which: 40, keyCode: 40 });
    userEvent.click(screen.getByText(/Azure Shared Access Signature/i));
    userEvent.type(screen.getByLabelText(/Azure Storage Sas Token/i), sasToken);
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