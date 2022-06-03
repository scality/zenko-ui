import { Fieldset, Input, Label } from '../../../ui-elements/FormLayout';
import { SpacedBox } from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import React, { useState } from 'react';
import { LocationDetailsFormProps } from '.';
import ColdStorageIcon from '../../../ui-elements/ColdStorageIcon';
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
    <div>
      <Fieldset>
        <Label>Temperature</Label>
        <SpacedBox mt={2}>
          <span>
            <ColdStorageIcon /> Cold
          </span>
        </SpacedBox>
      </Fieldset>
      <Fieldset>
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
      </Fieldset>
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
