import { IconHelp } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/next';
import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import React, { useState } from 'react';
import styled from 'styled-components';
import { LocationDetailsFormProps } from '.';
import ColdStorageIcon from '../../../ui-elements/ColdStorageIcon';
import {
  Fieldset,
  Input,
  Label,
  SectionTitle,
} from '../../../ui-elements/FormLayout';
import InputList from '../../../ui-elements/InputList';
type State = {
  endpoint: string;
  repoId: string[];
  nsId: string;
  username: string;
  password: string;
};
const INIT_STATE: State = {
  endpoint: '',
  repoId: [''],
  nsId: '',
  username: '',
  password: '',
};

const FontWeightNormalSpan = styled.span`
  font-weight: normal;
`;

const InheritContainerWidthLabel = styled(Label)({
  width: 'inherit',
});

const TertiaryText = styled.span`
  color: ${(props) => props.theme.brand.textTertiary};
  margin-left: ${spacing.sp4};
`;

const EndpointFieldset = styled(Fieldset)({
  marginTop: spacing.sp20,
});

export default function LocationDetailsTapeDMF({
  details,
  onChange,
}: LocationDetailsFormProps) {
  const [formState, setFormState] = useState<State>(() => ({
    ...Object.assign({}, INIT_STATE, details),
  }));

  const onInternalStateChange = (key: string, value: any) => {
    setFormState({ ...formState, [key]: value });

    if (onChange) {
      onChange({ ...formState, [key]: value });
    }
  };

  const onFormItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    onInternalStateChange(target.name, value);
  };

  return (
    <div>
      <Fieldset direction="row">
        <InheritContainerWidthLabel
          tooltipMessages={[
            <>
              The Temperature of this Location is Cold. <br /> <br /> You can
              move your data in this Location through a Transition Workflow.
              <br /> <br />
              Once your data are in this Location, you can only trigger a
              request for restoration to get a temporary access to the object.
            </>,
          ]}
          tooltipWidth="30rem"
        >
          Temperature
        </InheritContainerWidthLabel>
        <Box ml={spacing.sp20}>
          <ColdStorageIcon /> <TertiaryText>Cold</TertiaryText>
        </Box>
      </Fieldset>
      <EndpointFieldset>
        <Label required htmlFor="endpoint">
          Endpoint
        </Label>
        <Input
          name="endpoint"
          id="endpoint"
          type="text"
          placeholder="example: ws://path.to.my.dmf"
          value={formState.endpoint}
          onChange={onFormItemChange}
          autoComplete="off"
        />
      </EndpointFieldset>
      <Box mt={spacing.sp24} mb={spacing.sp24}>
        <SectionTitle fontSize={fontSize.large}>
          DMF-specific parameters{' '}
          <IconHelp
            tooltipMessage="repoId and namespace id identify where objects on the Tape come from.\n\nReview your Cold storage service provider's documentation to have more details."
            overlayStyle={{ width: '32rem' }}
            placement="right"
          />
        </SectionTitle>
      </Box>
      <Fieldset>
        <InputList
          id="repoids"
          required
          label="RepoId(s)"
          getInputProps={() => ({ autoComplete: 'off', type: 'text' })}
          values={formState.repoId}
          onChange={(repoId) => onInternalStateChange('repoId', repoId)}
        />
      </Fieldset>
      <Fieldset>
        <Label required htmlFor="nsId">
          Namespace Id
        </Label>
        <Input
          name="nsId"
          id="nsId"
          type="text"
          placeholder=""
          value={formState.nsId}
          onChange={onFormItemChange}
          autoComplete="off"
        />
      </Fieldset>
      <Box mt={spacing.sp24} mb={spacing.sp24}>
        <SectionTitle fontSize={fontSize.large}>
          Credentials{' '}
          <IconHelp
            tooltipMessage="This location type requires credentials.\n\nIt is a best practice to enter credentials specifically generated for this access, with only the privileges needed to perform the desired tasks."
            overlayStyle={{ width: '32rem' }}
            placement="right"
          />
        </SectionTitle>
      </Box>
      <Fieldset>
        <Label required htmlFor="username">
          Username
        </Label>
        <Input
          name="username"
          id="username"
          type="text"
          placeholder=""
          value={formState.username}
          onChange={onFormItemChange}
          autoComplete="off"
        />
      </Fieldset>
      <Fieldset>
        <Label required htmlFor="password">
          Password
        </Label>
        <Input
          name="password"
          id="password"
          type="password"
          placeholder=""
          value={formState.password}
          onChange={onFormItemChange}
          autoComplete="off"
        />
      </Fieldset>
    </div>
  );
}
