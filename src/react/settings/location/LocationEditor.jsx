import { Button, Select } from '@scality/core-ui';
import { LocationDetails, defaultLocationType, storageOptions } from './LocationDetails';
import React, { useState } from 'react';
import { convertToLocation, newLocationForm } from './utils';
import CreateContainer from '../../ui-elements/CreateContainer';
import Input from '../../ui-elements/Input';
import LocationOptions from './LocationOptions';
import { connect } from 'react-redux';
import { saveLocation } from '../../actions';
import { selectStorageOptions } from '../../utils/storageOptions';

// TODO: edit location with locationInfo state
// Remember when editing location name and type fields have to be disabled
function LocationEditor(props) {
    const [location, setLocation] = useState(newLocationForm());

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
        console.log('location!!!', location);
        props.saveLocation(convertToLocation(location));
    };

    const cancel = () => {
        console.log('cannot cancel yet!');
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
                    editingExisting={false}
                    capabilities={props.capabilities}
                />
            </div>
        );
    };

    const locationOption = selectStorageOptions(null, props.capabilities, makeLabel);
    return <CreateContainer>
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
                // disabled={props.editingExisting}
                autoComplete='off' />
        </fieldset>
        <fieldset>
            <label htmlFor="locationType"> Location Type </label>
            <Select
                id='locationType'
                name="locationType"
                options={locationOption}
                isOptionDisabled={(option) => option.disabled === true }
                onChange={onTypeChange}
                // disabled={props.editingExisting}
                value = {locationOption.find(l => l.value === location.locationType)}
            />
        </fieldset>
        {maybeShowDetails()}
        <LocationOptions
            locationType={location.locationType}
            locationOptions={location.options}
            onChange={onOptionsChange}
        />
        <div className='footer'>
            <Button outlined onClick={cancel} text='Cancel'/>
            <Button outlined onClick={save} text='Add'/>
        </div>
    </CreateContainer>;
}

function mapStateToProps(state) {
    return {
        capabilities: state.instanceStatus.latest.state.capabilities || {},
    };
}

function mapDispatchToProps(dispatch) {
    return {
        saveLocation: (location: Location) => { dispatch(saveLocation(location)); },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(LocationEditor);
