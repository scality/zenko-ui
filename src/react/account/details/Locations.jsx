// @flow
import { Button } from '@scality/core-ui';
import React from 'react';
import { push } from 'connected-react-router';
import { useDispatch } from 'react-redux';

function Locations() {
    const dispatch = useDispatch();
    return (
        <div>
            <Button variant="secondary" onClick={() => dispatch(push('/create-location'))} text='Add location'/>
        </div>
    );
}

export default Locations;
