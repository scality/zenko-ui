import { Banner, Button, Select } from '@scality/core-ui';
import { LocationDetails, defaultLocationType, storageOptions } from './LocationDetails';
import React, {  useMemo, useState } from 'react';
import { convertToForm, convertToLocation, newLocationDetails, newLocationForm } from './utils';
import { resetEditLocation, saveLocation } from '../../actions';
import FormContainer from '../../ui-elements/FormContainer';
import Input from '../../ui-elements/Input';
import LocationOptions from './LocationOptions';
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

// TODO: edit location with locationInfo state
// Remember when editing location name and type fields have to be disabled
function LocationEditor(props) {
    const [location, setLocation] = useState(convertToForm(Object.assign({}, newLocationDetails(), props.locationEditing)));

    const selectOptions = useMemo(() => {
        return selectStorageOptions(null, props.capabilities, makeLabel);
    }, [props.capabilities]);

    const editingExisting = useMemo(() => {
        return !!(props.locationEditing && props.locationEditing.objectId);
    }, [props.locationEditing]);

    const onChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        const l = {
            ...location,
            [e.target.name]: value,
        };
        setLocation(l);
    };

    const save = (e) => {
        if (e) {
            e.preventDefault();
        }
        // console.log('location!!!', location);
        props.saveLocation(convertToLocation(location));
    };

    const cancel = () => {
        props.resetEditLocation();
        props.redirect('/');
    };

    const onTypeChange = (v: LocationSelectOption) => {
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
        const l = {
            ...location,
            details,
        };
        setLocation(l);
    };

    const onOptionsChange = (e: SyntheticInputEvent<HTMLInputElement>) => {
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

    return <FormContainer>
        <div className='sc-title'> Add new storage location </div>
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
        <div className='footer'>
            <div className='zk-banner'>
                {
                    errorMessage && <Banner
                        icon={<i className="fas fa-exclamation-triangle" />}
                        title="Error"
                        variant="danger">
                        {errorMessage}
                    </Banner>
                }
            </div>
            <Button outlined onClick={cancel} text='Cancel'/>
            <Button outlined disabled={disable} onClick={save} text='Add'/>
        </div>
    </FormContainer>;
}

function mapStateToProps(state) {
    return {
        capabilities: state.instanceStatus.latest.state.capabilities || {},
        locationEditing: state.uiLocation.locationEditing,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        saveLocation: (location: Location) => { dispatch(saveLocation(location)); },
        redirect: path => dispatch(push(path)),
        resetEditLocation: () => dispatch(resetEditLocation()),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(LocationEditor);
