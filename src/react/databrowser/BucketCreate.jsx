import { Button, Select } from '@scality/core-ui';
import React, {useEffect, useState} from 'react';
import CreateContainer from '../ui-elements/CreateContainer';
import Input from '../ui-elements/Input';
import { connect } from 'react-redux';
import { createBucket } from '../actions';
import { locationWithIngestion } from '../utils/storageOptions';
import { push } from 'connected-react-router';
import { storageOptions } from '../monitor/location/LocationDetails';
import styled from 'styled-components';

const SelectOption = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    .float-right{
        font-size: 11px;
        margin-right: 10px;
    }
`;

//
// const locationOptions = locations => {
//     return Object.keys(locations).map(locationName => {
//         return {
//             label: locationName,
//             value: locationName,
//         };
//     });
// };

function BucketCreate(props) {

    const [ bucket, setBucket ] = useState({ name: '', locationConstraint: 'us-east-1' });

    const [ selectLocations, setSelectLocations ] = useState([]);

    useEffect(() => {
        setSelectLocations(locationWithIngestion(props.locations, props.capabilities));
    }, []);

    // const selectLocationOptions = locationOptions(locationWithIngestion(props.locations, props.capabilities));

    const save = (e) => {
        if (e) {
            e.preventDefault();
        }
        console.log('bucket!!!', bucket);
        // props.createBucket(bucket);
    };

    const cancel = () => {
        props.redirect('/databrowser');
    };

    const onChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        const b = {
            ...bucket,
            [e.target.name]: value,
        };
        setBucket(b);
    };

    const onSelectChange = l => {
        setBucket({ ...bucket, locationConstraint: l.value });
    };

    const renderLocation = (option) => {
        const locationType = option.locationType;
        const mirrorMode = option.mirrorMode;
        const locationTypeName = storageOptions[locationType].name;
        return (
            <SelectOption>
                {
                    mirrorMode ?
                        <span>{option.value.split(':ingest')[0]} <small>(Mirror mode)</small></span> :
                        <span>{option.value}</span>
                }
                <span className="float-right">{locationTypeName}</span>
            </SelectOption>
        );
    };

    return <CreateContainer>
        <div className='sc-title'> create  bucket </div>
        <fieldset>
            <label htmlFor='userName'> Name </label>
            <Input
                type='text'
                id='name'
                name='name'
                placeholder='User Name'
                onChange={onChange}
                value={bucket.name}
                autoComplete='off' />
        </fieldset>
        <fieldset>
            <label htmlFor='locationConstraint'> Location Constraint </label>
            <Select
                id='locationConstraint'
                name='locationConstraint'
                placeholder='Location Name'
                onChange={onSelectChange}
                options={selectLocations}
                formatOptionLabel={renderLocation}
                value={selectLocations.find(l => l.value === bucket.locationConstraint)}
                autoComplete='off' />
        </fieldset>
        <div className='footer'>
            <Button outlined onClick={cancel} text='Cancel'/>
            <Button outlined onClick={save} text='Add'/>
        </div>
    </CreateContainer>;
}

function mapStateToProps(state) {
    return {
        locations: state.configuration.latest.locations,
        capabilities: state.instanceStatus.latest.state.capabilities || {},
    };
}

function mapDispatchToProps(dispatch) {
    return {
        createBucket: bucket => dispatch(createBucket(bucket)),
        redirect: path => dispatch(push(path)),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(BucketCreate);
