import { Button, Input, Select } from '@scality/core-ui';
import React, { useState } from 'react';
import CreateContainer from '../../ui-elements/CreateContainer';
import { connect } from 'react-redux';
import { newLocationForm } from './utils';
import { saveLocation } from '../../actions';
import { selectStorageOptions } from '../../utils/storageOptions';
import { storageOptions } from './LocationDetails';

// TODO: edit location with locationInfo state
// Remember when editing location name and type have to be disabled
function LocationEditor(props) {
    const [location, setLocation] = useState(newLocationForm());

    const onChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        const l = {
            ...location,
            [e.target.name]: value,
        };
        setLocation({ l });
    };

    const save = (e) => {
        if (e) {
            e.preventDefault();
        }
        console.log('location!!!', location);
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

    // TODO: add icon
    function makeLabel(locationType, assetRoot) {
        const details = storageOptions[locationType];
        return (
            <div>
                &nbsp;
                <span>{details.name}</span>
            </div>
        );
    }

    return <CreateContainer>
        <div className='title'> Add new storage location </div>
        <div className='input'>
            <div className='name'> location name </div>
            <Input
                type='text'
                name='name'
                onChange={onChange}
                value={location.name}
                placeholder="zenko-us-west-2"
                // disabled={props.editingExisting}
                autoComplete='off' />
        </div>
        <div className='input'>
            <div className='name'> Location Type </div>
            <Select
                menuContainerStyle={{ zIndex: 5 }}
                name="locationType"
                options={selectStorageOptions(null, props.capabilities, makeLabel)}
                isOptionDisabled={(option) => option.disabled === true }
                onChange={onTypeChange}
                // disabled={props.editingExisting}
            />
        </div>
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
