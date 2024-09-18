import {
  Banner,
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
} from '@scality/core-ui';
import { Button, Input, Select } from '@scality/core-ui/dist/next';

import { ChangeEvent, useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { LocationV1 } from '../../js/managementClient/api';
import { useWaitForRunningConfigurationVersionToBeUpdated } from '../../js/mutations';
import { LocationTypeKey } from '../../types/config';
import { AppState } from '../../types/state';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useManagementClient } from '../ManagementProvider';
import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useAuth, useInstanceId } from '../next-architecture/ui/AuthProvider';
import Loader from '../ui-elements/Loader';
import {
  getLocationTypeKey,
  selectStorageOptions,
} from '../utils/storageOptions';
import { LocationDetails, storageOptions } from './LocationDetails';
import LocationOptions from './LocationOptions';
import locationFormCheck from './locationFormCheck';
import {
  checkIsRingS3Reseller,
  convertToForm,
  convertToLocation,
  isLocationExists,
  newLocationDetails,
  newLocationForm,
} from './utils';
import { Loader as LoaderCoreUI } from '@scality/core-ui';

//Temporary hack waiting for the layout
const StyledForm = styled(Form)`
  height: calc(100vh - 48px);
`;

const makeLabel = (locationType: LocationTypeKey) => {
  const details = storageOptions[locationType];
  return details.name;
};

function LocationEditor() {
  const history = useHistory();
  const { locationName } = useParams<{ locationName: string }>();
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const {
    accountsLocationsAndEndpoints,
    refetchAccountsLocationsEndpointsMutation,
    status,
  } = useAccountsLocationsAndEndpoints({
    accountsLocationsEndpointsAdapter,
  });
  const locations = accountsLocationsAndEndpoints?.locations;
  const locationEditing = locations?.find(
    (location) => location.name === locationName,
  );
  const capabilities = useSelector(
    (state: AppState) => state.instanceStatus.latest.state.capabilities,
  );
  const editingExisting = !!(locationEditing && locationEditing.id);
  const [location, setLocation] = useState(
    convertToForm({ ...newLocationDetails(), ...locationEditing }),
  );
  const selectOptions = useMemo(() => {
    return selectStorageOptions(
      capabilities,
      locations,
      makeLabel,
      !editingExisting,
    );
  }, [capabilities, editingExisting, locations]);
  useMemo(() => {
    if (locationEditing) {
      setLocation(convertToForm(locationEditing));
    }
  }, [locationEditing]);

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const l = { ...location, [e.target.name]: value };
    setLocation(l);
  };

  const managementClient = useManagementClient();
  const { getToken } = useAuth();
  const instanceId = useInstanceId();
  const createLocationMutation = useMutation({
    mutationFn: async (location: LocationV1) => {
      const client = notFalsyTypeGuard(managementClient);
      client.setToken(await getToken());
      return client
        .createConfigurationOverlayLocation(location, instanceId)
        .catch(async (error) => {
          if (error.status === 422) {
            throw await error.json();
          }
        });
    },
  });
  const updateLocationMutation = useMutation({
    mutationFn: (location: LocationV1) => {
      return notFalsyTypeGuard(managementClient)
        .updateConfigurationOverlayLocation(location.name, instanceId, location)
        .catch(async (error) => {
          if (error.status === 422) {
            throw await error.json();
          }
        });
    },
  });
  const {
    setReferenceVersion,
    waitForRunningConfigurationVersionToBeUpdated,
    status: waiterStatus,
  } = useWaitForRunningConfigurationVersionToBeUpdated();

  const save = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }

    let submitLocation = { ...location };

    const isRingS3Reseller = checkIsRingS3Reseller(submitLocation.locationType);

    if (isRingS3Reseller) {
      //@ts-expect-error fix this when you are working on it
      submitLocation = {
        ...submitLocation,
        ...{ locationType: 'location-scality-ring-s3-v1' },
      };
    }
    setReferenceVersion({
      onRefTaken: () => {
        if (editingExisting) {
          //@ts-expect-error fix this when you are working on it
          updateLocationMutation.mutate(convertToLocation(submitLocation), {
            onSuccess: () => {
              waitForRunningConfigurationVersionToBeUpdated();
            },
          });
        } else {
          //@ts-expect-error fix this when you are working on it
          createLocationMutation.mutate(convertToLocation(submitLocation), {
            onSuccess: () => {
              waitForRunningConfigurationVersionToBeUpdated();
            },
          });
        }
      },
    });
  };

  useMemo(() => {
    if (waiterStatus === 'success') {
      refetchAccountsLocationsEndpointsMutation.mutate(undefined, {
        onSuccess: () => {
          history.goBack();
        },
      });
    }
  }, [waiterStatus]);

  const loading =
    createLocationMutation.isLoading ||
    updateLocationMutation.isLoading ||
    waiterStatus === 'waiting';

  const cancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.preventDefault();
    }

    history.goBack();
  };

  const onTypeChange = (locationType: string) => {
    if (location.locationType !== locationType) {
      const l = {
        ...newLocationForm(),
        name: location.name || '',
        locationType,
        details: {},
      };
      //@ts-expect-error fix this when you are working on it
      setLocation(l);
    }
  };

  const onDetailsChange = (details: unknown) => {
    const l = { ...location, details };
    //@ts-expect-error fix this when you are working on it
    setLocation(l);
  };

  const onOptionsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const l = {
      ...location,
      options: { ...location.options, [e.target.name]: value },
    };
    setLocation(l);
  };

  const maybeShowDetails = () => {
    if (location.locationType === 'location-file-v1') {
      return null;
    }

    return (
      <LocationDetails
        edit
        locationType={location.locationType}
        details={location.details}
        onChange={onDetailsChange}
        editingExisting={editingExisting}
        //@ts-expect-error fix this when you are working on it
        capabilities={capabilities}
      />
    );
  };

  //@ts-expect-error fix this when you are working on it
  const { disable, errorMessageFront } = locationFormCheck(location);
  let displayErrorMessage;

  const hasError =
    createLocationMutation.isError ||
    updateLocationMutation.isError ||
    waiterStatus === 'error';

  const errorMessage =
    //@ts-expect-error fix this when you are working on it
    createLocationMutation.error?.message ||
    //@ts-expect-error fix this when you are working on it
    updateLocationMutation.error?.message ||
    (waiterStatus === 'error' ? 'Error while saving location' : undefined);

  if (errorMessageFront) {
    displayErrorMessage = errorMessageFront;
  } else if (hasError && errorMessage) {
    displayErrorMessage = `Could not save: ${errorMessage}`;
  }

  const locationTypeKey = getLocationTypeKey(location);

  if (status === 'loading' || status === 'idle') {
    //@ts-expect-error fix this when you are working on it
    return <Loader>Loading location...</Loader>;
  }

  return (
    <StyledForm
      layout={{
        kind: 'page',
        title: `${locationEditing ? 'Edit' : 'Add New'} Storage Location`,
      }}
      requireMode="partial"
      banner={
        displayErrorMessage && (
          <Banner
            icon={<Icon name="Exclamation-triangle" />}
            title="Error"
            variant="danger"
          >
            {displayErrorMessage}
          </Banner>
        )
      }
      rightActions={
        <Stack gap="r16">
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={cancel}
            label="Cancel"
          />

          <Button
            type="button"
            variant="primary"
            icon={
              loading ? (
                <LoaderCoreUI size="small" />
              ) : (
                locationEditing && <Icon name="Save" />
              )
            }
            disabled={
              disable || loading || !isLocationExists(location.locationType)
            }
            onClick={save}
            label={
              loading
                ? 'Saving...'
                : locationEditing
                ? 'Save Changes'
                : 'Create'
            }
          />
        </Stack>
      }
    >
      <FormSection title={{ name: 'General' }}>
        <FormGroup
          id="name"
          content={
            <Input
              id="name"
              type="text"
              name="name"
              onChange={onChange}
              value={location.name}
              placeholder="us-west-2"
              disabled={editingExisting}
              autoComplete="off"
            />
          }
          required
          labelHelpTooltip={
            <>
              Location name that will be used in ARTESCA Data Services. It is
              not known to the storage provider. <br /> <br />
              Use only lowercase letters, numbers, and dashes.
            </>
          }
          label="Location Name"
        />

        <FormGroup
          id="locationType"
          labelHelpTooltip={
            <>
              Each Storage location type has its own requirements.
              <br /> <br />
              Unlike ARTESCA local storage, all public clouds require
              authentication information.
            </>
          }
          required
          label="Location Type"
          content={
            <Select
              id="locationType"
              placeholder="Select a location type..."
              onChange={onTypeChange}
              disabled={editingExisting}
              //@ts-expect-error fix this when you are working on it
              value={locationTypeKey}
            >
              {selectOptions.map((opt, i) => (
                <Select.Option key={i} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          }
        />
      </FormSection>

      {locationTypeKey && (
        <>
          {maybeShowDetails()}
          <LocationOptions
            locationType={location.locationType}
            locationOptions={location.options}
            onChange={onOptionsChange}
          />
        </>
      )}
    </StyledForm>
  );
}

export default LocationEditor;
