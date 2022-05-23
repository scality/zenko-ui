import {
    Checkbox,
    CheckboxContainer,
    WarningInput,
    Fieldset,
    Input,
    Label,
  } from '../../../ui-elements/FormLayout';
  import { HelpLocationCreationAsyncNotification } from '../../../ui-elements/Help';
  import React, { useState } from 'react';
  import { XDM_FEATURE } from '../../../../js/config';
  import SpacedBox from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
  import { LocationDetailsFormProps } from '.';
  type State = {
    endpoint: string;
    repoId: string[];
    nsId: string;
    username: string;
    password: string;
  };
  const INIT_STATE: State = {
    endpoint: '',
    repoId: [],
    nsId: '',
    username: '',
    password: '',
  };
  export default function LocationDetailsTapeDMF({
    capabilities,
    details,
    editingExisting,
    locationType,
    onChange,
  }: LocationDetailsFormProps) {
    const [formState, setFormState] = useState<State>(() => ({
      ...Object.assign({}, INIT_STATE, details),
      secretKey: '',
    }));
  
    const onFormItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const target = e.target;
      const value = target.type === 'checkbox' ? target.checked : target.value;
      setFormState({ ...formState, [target.name]: value });
  
      if (onChange) {
        onChange({ ...formState, [target.name]: value });
      }
    };
  
    return (
      <div>
        <Fieldset>
          <Label>Temperature</Label>
          <span><i className='fas fa-snowflake'/> Cold</span>
        </Fieldset>
        <Fieldset>
          <Label required htmlFor="endpoint">Endpoint</Label>
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
          <Label required htmlFor="nsId">Namespace Id</Label>
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
          <Label required htmlFor="username">Username</Label>
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
          <Label required htmlFor="password">Password</Label>
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
  