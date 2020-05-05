import { Banner, Button, Select } from '@scality/core-ui';
import { LocationDetails, defaultLocationType, storageOptions } from './LocationDetails';
import React, {  useMemo, useState } from 'react';
import { convertToForm, convertToLocation, newLocationDetails, newLocationForm } from './utils';
import { clearError, saveLocation } from '../../actions';
import { Container } from '../../ui-elements/Container';
import FormContainer from '../../ui-elements/FormContainer';
import Input from '../../ui-elements/Input';
import LocationOptions from './LocationOptions';
import { batch } from 'react-redux';
import { connect } from 'react-redux';
import locationFormCheck from './locationFormCheck';
import { push } from 'connected-react-router';
import { selectStorageOptions } from '../../utils/storageOptions';


// TODO: add icon
const makeLabel = (locationType, assetRoot) => {
    const details = storageOptions[locationType];
    return (
        <div>
            &nbsp;
            <span>{details.name}</span>
        </div>
    );
};

function LocationEditor(props) {
    const editingExisting = !!(props.locationEditing && props.locationEditing.objectId);

    // Display error if location does not exist.
    if (props.match.params.locationName && !editingExisting){
        return <Container> <Banner
            icon={<i className="fas fa-exclamation-triangle" />}
            title="Error"
            variant="danger">
            This location does not exist.
        </Banner>
        <br/>
        <div className='button-align-right'>
            <Button outlined onClick={() => props.redirect('/')} text='Back'/>
        </div>
        </Container>;
    }


    const [location, setLocation] = useState(convertToForm(Object.assign({}, newLocationDetails(), props.locationEditing)));

    const selectOptions = useMemo(() => {
        return selectStorageOptions(null, props.capabilities, makeLabel);
    }, [props.capabilities]);

    const onChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        const l = {
            ...location,
            [e.target.name]: value,
        };
        if (props.hasError) {
            props.clearError();
        }
        setLocation(l);
    };

    const save = (e) => {
        if (e) {
            e.preventDefault();
        }

        if (props.hasError) {
            props.clearError();
        }
        props.saveLocation(convertToLocation(location));
    };

    const cancel = () => {
        batch(() => {
            if (props.hasError) {
                props.clearError();
            }
            props.redirect('/');
        });
    };

    const onTypeChange = (v: LocationSelectOption) => {
        if (props.hasError) {
            props.clearError();
        }
        if (location.locationType !== v.value) {
            const l = {
                ...newLocationForm(),
                name: location.name || '',
                locationType: v.value,
                details: {},
            };
            setLocation(l);
        }
    };

    const onDetailsChange = (details) => {
        if (props.hasError) {
            props.clearError();
        }
        const l = {
            ...location,
            details,
        };
        setLocation(l);
    };

    const onOptionsChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
        if (props.hasError) {
            props.clearError();
        }
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
        if (location.locationType === defaultLocationType) {
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
                    capabilities={props.capabilities}
                />
            </div>
        );
    };

    const { disable, errorMessage } = locationFormCheck(location);
    let displayErrorMessage;
    if (!!errorMessage) {
        displayErrorMessage = errorMessage;
    } else if (props.hasError) {
        displayErrorMessage = `Could not save: ${props.errorMessage}`;
    }

    return <FormContainer>
        <div className='zk-form-title'> Add new storage location </div>
        <fieldset>
            <label htmlFor="name"> Location Name </label>
            <Input
                id='name'
                type='text'
                name='name'
                debounceTimeout={0}
                onChange={onChange}
                value={location.name}
                placeholder="zenko-us-west-2"
                disabled={editingExisting}
                autoComplete='off' />
        </fieldset>
        <fieldset>
            <label htmlFor="locationType"> Location Type </label>
            <Select
                id='locationType'
                name="locationType"
                options={selectOptions}
                isOptionDisabled={(option) => option.disabled === true }
                onChange={onTypeChange}
                isDisabled={editingExisting}
                value = {selectOptions.find(l => l.value === location.locationType)}
            />
        </fieldset>
        {maybeShowDetails()}
        <LocationOptions
            locationType={location.locationType}
            locationOptions={location.options}
            onChange={onOptionsChange}
        />
        <div className='zk-form-footer'>
            <div className='zk-form-banner'>
                {
                    displayErrorMessage && <Banner
                        icon={<i className="fas fa-exclamation-triangle" />}
                        title="Error"
                        variant="danger">
                        {displayErrorMessage}
                    </Banner>
                }
            </div>
            <Button outlined onClick={cancel} text='Cancel'/>
            <Button outlined disabled={disable} onClick={save} text='Add'/>
        </div>
    </FormContainer>;
}

function mapStateToProps(state, ownProps) {
    const locationName = ownProps.match.params.locationName;
    const locationEditing = state.configuration.latest.locations[locationName];
    return {
        capabilities: state.instanceStatus.latest.state.capabilities,
        locationEditing: {...locationEditing},
        hasError: !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent',
        errorMessage: state.uiErrors.errorMsg,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        saveLocation: (location: Location) => { dispatch(saveLocation(location)); },
        redirect: path => dispatch(push(path)),
        clearError: () => dispatch(clearError()),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(LocationEditor);
