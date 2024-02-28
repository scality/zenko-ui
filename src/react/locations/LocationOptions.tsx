import { default as BasicInput } from '../ui-elements/Input';
import type { LocationFormOptions } from '../../types/location';
import type { LocationName } from '../../types/config';
import { ChangeEvent } from 'react';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
import {
  FormGroup,
  FormSection,
} from '@scality/core-ui/dist/components/form/Form.component';
import { Checkbox } from '@scality/core-ui/dist/components/checkbox/Checkbox.component';

const isTransientEnabled = (locationType: LocationName) => {
  const transientLocationsType = [
    'location-scality-sproxyd-v1',
    'location-file-v1',
    'location-scality-hdclient-v2',
  ];
  return transientLocationsType.includes(locationType);
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
