// @flow
import FormContainer, * as F from '../../ui-elements/FormLayout';
import { LocationDetails, storageOptions } from './LocationDetails';
import React, { useMemo, useRef, useState } from 'react';
import { batch, useDispatch, useSelector } from 'react-redux';
import { clearError, saveLocation } from '../../actions';
import { convertToForm, convertToLocation, isLocationExists, newLocationDetails, newLocationForm } from './utils';
import type { AppState } from '../../../types/state';
import { Banner } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import type { LocationName } from '../../../types/config';
import LocationOptions from './LocationOptions';
import { goBack } from 'connected-react-router';
import locationFormCheck from './locationFormCheck';
import { selectStorageOptions } from '../../utils/storageOptions';
import { useOutsideClick } from '../../utils/hooks';
import { useParams } from 'react-router-dom';

const makeLabel = (locationType) => {
    const details = storageOptions[locationType];
    return details.name;
};

function LocationEditor() {
    const dispatch = useDispatch();
    const { locationName } = useParams();
    const locationEditing = useSelector((state: AppState) => state.configuration.latest.locations[locationName || '']);
    const capabilities = useSelector((state: AppState) => state.instanceStatus.latest.state.capabilities);
    const hasError = useSelector((state: AppState) => !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent');
    const errorMessage = useSelector((state: AppState) => state.uiErrors.errorMsg);
    const loading = useSelector((state: AppState) => state.networkActivity.counter > 0);

    const editingExisting = !!(locationEditing && locationEditing.objectId);

    const [location, setLocation] = useState(convertToForm({ ...newLocationDetails(), ...locationEditing }));

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
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        const l = {
            ...location,
            [e.target.name]: value,
        };
        clearServerError();
        setLocation(l);
    };

    const save = (e) => {
        if (e) {
            e.preventDefault();
        }

        clearServerError();
        dispatch(saveLocation(convertToLocation(location)));
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
        const l = {
            ...location,
            details,
        };
        setLocation(l);
    };

    const onOptionsChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        clearServerError();
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        const l = {
            ...location,
            options: {
                ...location.options,
                [e.target.name]: value,
            },
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

    return <FormContainer>
        <F.Form ref={formRef}>
            <F.Title>
                { `${locationEditing ? 'Edit' : 'Add New'} Storage Location` }
            </F.Title>
            <F.Fieldset>
                <F.Label htmlFor="name"> Location Name </F.Label>
                <F.Input
                    id='name'
                    type='text'
                    name='name'
                    debounceTimeout={0}
                    onChange={onChange}
                    value={location.name}
                    placeholder="us-west-2"
                    disabled={editingExisting}
                    autoComplete='off' />
            </F.Fieldset>
            <F.Fieldset>
                <F.Label htmlFor="locationType"> Location Type </F.Label>
                <F.Select
                    id='locationType'
                    name="locationType"
                    placeholder='Select an option...'
                    onChange={onTypeChange}
                    isDisabled={editingExisting}
                    value={location.locationType}
                >
                    {selectOptions.map((opt, i) => <F.Select.Option key={i} value={opt.value}>{opt.label}</F.Select.Option>)}
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
                    {
                        displayErrorMessage && <Banner
                            icon={<i className="fas fa-exclamation-triangle" />}
                            title="Error"
                            variant="danger">
                            {displayErrorMessage}
                        </Banner>
                    }
                </F.FooterError>
                <F.FooterButtons>
                    <Button variant="outline" disabled={loading} onClick={cancel} label='Cancel'/>
                    <Button variant="primary" icon={ locationEditing && <i className="fas fa-save" />} disabled={disable || loading || !isLocationExists(location.locationType)} onClick={save} label={ locationEditing ? 'Save Changes' : 'Create' }/>
                </F.FooterButtons>
            </F.Footer>
        </F.Form>
    </FormContainer>;
}

export default LocationEditor;
