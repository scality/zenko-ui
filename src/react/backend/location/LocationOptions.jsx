// @flow

import { Checkbox, CheckboxContainer, Fieldset, Label } from '../../ui-elements/FormLayout';
import { default as BasicInput } from '../../ui-elements/Input';
import type { LocationFormOptions } from '../../../types/location';
import type { LocationName } from '../../../types/config';
import React from 'react';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

const isTransientEnabled = (locationType: LocationName) => {
    return locationType === 'location-scality-sproxyd-v1' ||
        locationType === 'location-file-v1';
};

export const Input = styled(BasicInput)`
    width: 50px;
    margin: 0px ${spacing.sp4};
`;

type Props = {
    locationType: LocationName,
    locationOptions: LocationFormOptions,
    onChange: (e: SyntheticInputEvent<HTMLInputElement>) => void,
};
function LocationOptions(props: Props) {
    const { isTransient } = props.locationOptions;
    const showTransientOption = isTransientEnabled(props.locationType);
    const hasFields = showTransientOption; // if one or more field are visible show advanced options

    return hasFields && <Fieldset>
        <Label htmlFor="locationType"> Advanced Options </Label>
        <CheckboxContainer style={{ display: showTransientOption ? 'block' : 'none' }}>
            <Checkbox
                type="checkbox"
                name="isTransient"
                id="isTransientCheckbox"
                checked={isTransient}
                onChange={props.onChange}
            />
            <span> Delete objects after successful replication </span>
        </CheckboxContainer>
    </Fieldset>;
}

export default LocationOptions;
