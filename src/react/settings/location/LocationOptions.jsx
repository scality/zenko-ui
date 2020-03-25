// @noflow

import { Checkbox } from '@scality/core-ui';
import Input from '../../ui-elements/Input';
import React from 'react';
import styled from 'styled-components';

const Align = styled.div`
    display: flex;
    align-items: baseline;
    .option-input{
        width: 50px;
    }
    input{
        margin: 0px 5px;
    }
`;

const isTransientEnabled = (locationType: LocationName) => {
    return locationType === 'location-scality-sproxyd-v1' ||
        locationType === 'location-file-v1';
};

// TODO: add Tooltip
function LocationOptions(props) {
    const { isTransient, isSizeLimitChecked, sizeLimitGB, legacyAwsBehavior } = props.locationOptions;
    const showTransientOption = isTransientEnabled(props.locationType);

    return <div>
        <fieldset>
            <label htmlFor="locationType"> Advanced Options </label>
            <Align>
                <Checkbox className="option-checkbox"
                    type="checkbox"
                    name="isSizeLimitChecked"
                    id="isSizeLimitedCheckbox"
                    checked={isSizeLimitChecked}
                    onChange={props.onChange}
                />
                <span> &nbsp;&nbsp;Limit total size in this location to&nbsp; </span>
                <Input className="option-input"
                    disabled={!isSizeLimitChecked}
                    placeholder="50"
                    name="sizeLimitGB"
                    id="sizeLimitValueInput"
                    value={isSizeLimitChecked ? sizeLimitGB : ''}
                    onChange={props.onChange}
                />
                <span> &nbsp;GB&nbsp; </span>
            </Align>
            <div hidden={!showTransientOption}>
                <Checkbox className="option-checkbox"
                    type="checkbox"
                    name="isTransient"
                    id="isTransientCheckbox"
                    checked={isTransient}
                    onChange={props.onChange}
                    label="Delete objects after successful replication"
                />
            </div>
        </fieldset>
    </div>;
}

export default LocationOptions

// <Tooltip overlaystyle={{
//     fontSize: '15px',
// }}
// overlay="Delete objects from this location after they have been successfully replicated to all destinations">
//     <i key='bucketName1' className="fas fa-info-circle" />
// </Tooltip>
