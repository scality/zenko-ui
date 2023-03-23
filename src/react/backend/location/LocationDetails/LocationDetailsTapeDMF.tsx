import { FormGroup, FormSection } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/next';
import React, { useState } from 'react';
import { LocationDetailsFormProps } from '.';
import { ColdStorageIconLabel } from '../../../ui-elements/ColdStorageIcon';
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
    <>
      <FormSection>
        <FormGroup
          id="temperature"
          label="Temperature"
          helpErrorPosition="bottom"
          content={<ColdStorageIconLabel />}
        />

        <FormGroup
          id="endpoint"
          label="Endpoint"
          required
          helpErrorPosition="bottom"
          content={
            <Input
              name="endpoint"
              id="endpoint"
              type="text"
              placeholder="ws://path.to.my.dmf"
              value={formState.endpoint}
              onChange={onFormItemChange}
              autoComplete="off"
            />
          }
        />
      </FormSection>
      <FormSection
        title={{
          name: 'DMF-specific parameters',
          helpTooltip:
            "repoId and namespace id identify where objects on the Tape come from.\n\nReview your Cold storage service provider's documentation to have more details.",
        }}
      >
        <InputList
          id="repoids"
          required
          label="RepoId(s)"
          getInputProps={() => ({ autoComplete: 'off', type: 'text' })}
          values={formState.repoId}
          onChange={(repoId) => onInternalStateChange('repoId', repoId)}
        />

        <FormGroup
          id="nsId"
          label="Namespace Id"
          required
          helpErrorPosition="bottom"
          content={
            <Input
              name="nsId"
              id="nsId"
              type="text"
              placeholder=""
              value={formState.nsId}
              onChange={onFormItemChange}
              autoComplete="off"
            />
          }
        />
      </FormSection>
      <FormSection
        title={{
          name: 'Credentials',
          helpTooltip:
            'This location type requires credentials.\n\nIt is a best practice to enter credentials specifically generated for this access, with only the privileges needed to perform the desired tasks.',
        }}
      >
        <FormGroup
          id="username"
          label="Username"
          required
          helpErrorPosition="bottom"
          content={
            <Input
              name="username"
              id="username"
              type="text"
              placeholder=""
              value={formState.username}
              onChange={onFormItemChange}
              autoComplete="off"
            />
          }
        />

        <FormGroup
          id="password"
          label="Password"
          required
          helpErrorPosition="bottom"
          content={
            <Input
              name="password"
              id="password"
              type="password"
              placeholder=""
              value={formState.password}
              onChange={onFormItemChange}
              autoComplete="off"
            />
          }
        />
      </FormSection>
    </>
  );
}
