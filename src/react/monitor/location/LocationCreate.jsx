import { Button, Input } from '@scality/core-ui';
import React, { useState } from 'react';
import CreateContainer from '../../ui-elements/CreateContainer';
import { connect } from 'react-redux';
import { newLocationForm } from './utils';
import { saveLocation } from '../../actions';

function LocationCreate(props) {
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

    return <CreateContainer>
        <div className='title'> Add new storage location </div>
        <div className='input'>
            <div className='name'> location name </div>
            <Input
                type='text'
                name='name'
                placeholder='Location Name'
                onChange={onChange}
                value={location.name}
                autoComplete='off' />
        </div>
        <div className='footer'>
            <Button outlined onClick={cancel} text='Cancel'/>
            <Button outlined onClick={save} text='Add'/>
        </div>
    </CreateContainer>;
}

function mapDispatchToProps(dispatch) {
    return {
        saveLocation: (location: Location) => { dispatch(saveLocation(location)); },
    };
}

export default connect(null, mapDispatchToProps)(LocationCreate);
