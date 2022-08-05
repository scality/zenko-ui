import { Banner, SecondaryText } from '@scality/core-ui';
import { Box, Button } from '@scality/core-ui/dist/next';
import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import { goBack } from 'connected-react-router';
import React, { useMemo, useRef, useState } from 'react';
import { batch, useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { LocationName } from '../../../types/config';
import type { AppState } from '../../../types/state';
import { clearError, saveLocation } from '../../actions';
import FormContainer, * as F from '../../ui-elements/FormLayout';
import { useOutsideClick } from '../../utils/hooks';
import {
  getLocationTypeKey,
  selectStorageOptions,
} from '../../utils/storageOptions';
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

const makeLabel = (locationType) => {
  const details = storageOptions[locationType];
  return details.name;
};

const SecondaryTextItalic = styled(SecondaryText)({
  fontStyle: 'italic',
});

const HorizontalLine = styled.hr`
  border: ${spacing.sp1} inset ${(props) => props.theme.brand.backgroundLevel2};
  width: 100%;
  margin: 0;
`;
function LocationEditor() {
  const dispatch = useDispatch();
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
    dispatch(saveLocation(convertToLocation(submitLocation)));
  };

  const cancel = (e) => {
    if (e) {
      e.preventDefault();
    }

    batch(() => {
      clearServerError();
      dispatch(goBack());
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
      <div className="form-group">
        <LocationDetails
          edit
          locationType={location.locationType}
          details={location.details}
          onChange={onDetailsChange}
          editingExisting={editingExisting}
          capabilities={capabilities}
        />
      </div>
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
    <FormContainer>
      <F.Form ref={formRef}>
        <F.Title>
          {`${locationEditing ? 'Edit' : 'Add New'} Storage Location`}
        </F.Title>
        <HorizontalLine />
        <Box mt={spacing.sp16} mb={spacing.sp24}>
          <SecondaryTextItalic>All * are mandatory fields</SecondaryTextItalic>
        </Box>
        <F.SectionTitle fontSize={fontSize.large}>General</F.SectionTitle>
        <F.Fieldset>
          <F.Label
            htmlFor="name"
            required
            tooltipMessages={[
              <>
                Location name that will be used in ARTESCA Data Services. It is
                not known to the storage provider. <br /> <br />
                Use only lowercase letters, numbers, and dashes.
              </>,
            ]}
            tooltipWidth="38rem"
          >
            Location Name
          </F.Label>
          <F.Input
            id="name"
            type="text"
            name="name"
            debounceTimeout={0}
            onChange={onChange}
            value={location.name}
            placeholder="example: us-west-2"
            disabled={editingExisting}
            autoComplete="off"
          />
        </F.Fieldset>
        <F.Fieldset>
          <F.Label
            htmlFor="locationType"
            tooltipMessages={[
              <>
                Each Storage location type has its own requirements.
                <br /> <br />
                Unlike ARTESCA local storage, all public clouds require
                authentication information.
              </>,
            ]}
            tooltipWidth="32rem"
            required
          >
            Location Type
          </F.Label>
          <F.Select
            id="locationType"
            name="locationType"
            placeholder="Select an option..."
            onChange={onTypeChange}
            isDisabled={editingExisting}
            value={locationTypeKey}
          >
            {selectOptions.map((opt, i) => (
              <F.Select.Option key={i} value={opt.value}>
                {opt.label}
              </F.Select.Option>
            ))}
          </F.Select>
        </F.Fieldset>
        {maybeShowDetails()}
        <LocationOptions
          locationType={location.locationType}
          locationOptions={location.options}
          onChange={onOptionsChange}
        />
        <F.Footer>
          <F.FooterError>
            {displayErrorMessage && (
              <Banner
                icon={<i className="fas fa-exclamation-triangle" />}
                title="Error"
                variant="danger"
              >
                {displayErrorMessage}
              </Banner>
            )}
          </F.FooterError>
          <F.FooterButtons>
            <Button
              variant="outline"
              disabled={loading}
              onClick={cancel}
              label="Cancel"
            />
            <Button
              variant="primary"
              icon={locationEditing && <i className="fas fa-save" />}
              disabled={
                disable || loading || !isLocationExists(location.locationType)
              }
              onClick={save}
              label={locationEditing ? 'Save Changes' : 'Create'}
            />
          </F.FooterButtons>
        </F.Footer>
      </F.Form>
    </FormContainer>
  );
}

export default LocationEditor;
