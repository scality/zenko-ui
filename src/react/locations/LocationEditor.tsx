import {
  Banner,
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
} from '@scality/core-ui';
import { Button, Input, Select } from '@scality/core-ui/dist/next';

import React, { useMemo, useRef, useState } from 'react';
import { batch, useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { LocationName } from '../../types/config';
import type { AppState } from '../../types/state';
import { clearError, saveLocation } from '../actions';
import { useOutsideClick } from '../utils/hooks';
import {
  getLocationTypeKey,
  selectStorageOptions,
} from '../utils/storageOptions';
import { LocationDetails, storageOptions } from './LocationDetails';
import locationFormCheck from './locationFormCheck';
import LocationOptions from './LocationOptions';
import {
  checkIsRingS3Reseller,
  convertToForm,
  convertToLocation,
  isLocationExists,
  newLocationDetails,
  newLocationForm,
} from './utils';
import { useQueryClient } from 'react-query';
import { queries } from '../next-architecture/domain/business/locations';
import { useLocationAdapter } from '../next-architecture/ui/LocationAdapterProvider';
import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';

//Temporary hack waiting for the layout
const StyledForm = styled(Form)`
  height: calc(100vh - 48px);
`;

const makeLabel = (locationType) => {
  const details = storageOptions[locationType];
  return details.name;
};

function LocationEditor() {
  const dispatch = useDispatch();
  const history = useHistory();
  const { locationName } = useParams<{ locationName: string }>();
  const locationEditing = useSelector(
    (state: AppState) =>
      state.configuration.latest.locations[locationName || ''],
  );
  const capabilities = useSelector(
    (state: AppState) => state.instanceStatus.latest.state.capabilities,
  );
  const hasError = useSelector(
    (state: AppState) =>
      !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent',
  );
  const errorMessage = useSelector(
    (state: AppState) => state.uiErrors.errorMsg,
  );
  const loading = useSelector(
    (state: AppState) => state.networkActivity.counter > 0,
  );
  const accountsLocationsAndEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { refetchAccountsLocationsEndpoints } =
    useAccountsLocationsAndEndpoints({ accountsLocationsAndEndpointsAdapter });
  const editingExisting = !!(locationEditing && locationEditing.objectId);
  const [location, setLocation] = useState(
    convertToForm({ ...newLocationDetails(), ...locationEditing }),
  );
  const selectOptions = useMemo(() => {
    return selectStorageOptions(capabilities, makeLabel, !editingExisting);
  }, [capabilities, editingExisting]);

  const clearServerError = () => {
    if (hasError) {
      dispatch(clearError());
    }
  };

  // clear server errors if clicked on outside of element.
  const formRef = useRef(null);
  useOutsideClick(formRef, clearServerError);

  const onChange = (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const l = { ...location, [e.target.name]: value };
    clearServerError();
    setLocation(l);
  };

  const save = (e) => {
    if (e) {
      e.preventDefault();
    }
    clearServerError();

    let submitLocation = { ...location };

    const isRingS3Reseller = checkIsRingS3Reseller(submitLocation.locationType);

    if (isRingS3Reseller) {
      submitLocation = {
        ...submitLocation,
        ...{ locationType: 'location-scality-ring-s3-v1' },
      };
    }
    dispatch(saveLocation(convertToLocation(submitLocation), history));
    refetchAccountsLocationsEndpoints();
  };

  const cancel = (e) => {
    if (e) {
      e.preventDefault();
    }

    batch(() => {
      clearServerError();
      history.goBack();
    });
  };

  const onTypeChange = (v: LocationName) => {
    clearServerError();

    if (location.locationType !== v) {
      const l = {
        ...newLocationForm(),
        name: location.name || '',
        locationType: v,
        details: {},
      };
      setLocation(l);
    }
  };

  const onDetailsChange = (details) => {
    clearServerError();
    const l = { ...location, details };
    setLocation(l);
  };

  const onOptionsChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
    clearServerError();
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
        capabilities={capabilities}
      />
    );
  };

  const { disable, errorMessageFront } = locationFormCheck(location);
  let displayErrorMessage;

  if (errorMessageFront) {
    displayErrorMessage = errorMessageFront;
  } else if (hasError && errorMessage) {
    displayErrorMessage = `Could not save: ${errorMessage}`;
  }

  const locationTypeKey = getLocationTypeKey(location);

  return (
    <StyledForm
      ref={formRef}
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
            icon={locationEditing && <Icon name="Save" />}
            disabled={
              disable || loading || !isLocationExists(location.locationType)
            }
            onClick={save}
            label={locationEditing ? 'Save Changes' : 'Create'}
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
              placeholder="Select an option..."
              onChange={onTypeChange}
              disabled={editingExisting}
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
