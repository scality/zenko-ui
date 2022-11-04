import { default as BasicInput } from '../../ui-elements/Input';
import type { LocationFormOptions } from '../../../types/location';
import type { LocationName } from '../../../types/config';
import React, { ChangeEvent } from 'react';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
import { Checkbox, FormGroup, FormSection } from '@scality/core-ui';

const isTransientEnabled = (locationType: LocationName) => {
  return (
    locationType === 'location-scality-sproxyd-v1' ||
    locationType === 'location-file-v1'
  );
};

export const Input = styled(BasicInput)`
  width: 50px;
  margin: 0px ${spacing.sp4};
`;
type Props = {
  locationType: LocationName;
  locationOptions: LocationFormOptions;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

function LocationOptions(props: Props) {
  const { isTransient } = props.locationOptions;
  const showTransientOption = isTransientEnabled(props.locationType);
  const hasFields = showTransientOption; // if one or more field are visible show advanced options

  return (
    hasFields && (
      <FormSection title={{ name: 'Advanced Options' }}>
        {showTransientOption && (
          <FormGroup
            label="Is transient ?"
            id="isTransientCheckbox"
            content={
              <Checkbox
                id="isTransientCheckbox"
                checked={isTransient}
                label="Delete objects after successful replication when checked"
                onChange={props.onChange}
                name="isTransient"
              />
            }
          />
        )}
      </FormSection>
    )
  );
}

export default LocationOptions;
