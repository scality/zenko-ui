import { FormGroup, FormSection } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/components/inputv2/inputv2';
import React, { useState } from 'react';
import { LocationDetailsFormProps } from '.';

type State = {
  endpoint: string;
  repoId: string[];
  username: string;
  password: string;
  editingExisting?: boolean;
};

type Errors = {
  endpoint: string;
  repoId: string;
  username: string;
  password: string;
};

const INIT_STATE: State = {
  endpoint: '',
  repoId: [''],
  username: '',
  password: '',
};

const INIT_ERRORS: Errors = {
  endpoint: '',
  repoId: '',
  username: '',
  password: '',
};

export default function LocationDetailsTapeMiria({
  details,
  onChange,
}: LocationDetailsFormProps) {
  const [formState, setFormState] = useState<State>(() => {
    const initialState = { ...Object.assign({}, INIT_STATE, details) };
    if (initialState.editingExisting) {
      initialState.password = '';
    }
    return initialState;
  });
  const [errors, setErrors] = useState<Errors>(INIT_ERRORS);

  const validateField = (name: string, value: string | string[]) => {
    let error = '';

    switch (name) {
      case 'endpoint':
        if (!value) {
          error = 'Endpoint is required';
        } else {
          try {
            new URL(value as string);
          } catch (e) {
            error = 'Invalid endpoint URL format';
          }
        }
        break;
      case 'username':
        if (!value) {
          error = 'Username is required';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        }
        break;
      case 'repoId':
        if (!value || (Array.isArray(value) && (!value.length || !value[0]))) {
          error = 'Atempo Miria Repository is required';
        }
        break;
      default:
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const onInternalStateChange = (key: string, value: string | string[]) => {
    setFormState({ ...formState, [key]: value });
    validateField(key, value);

    if (onChange) {
      onChange({ ...formState, [key]: value });
    }
  };

  const onFormItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    onInternalStateChange(
      target.name,
      target.name === 'repoId' ? [value as string] : (value as string),
    );
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    validateField(
      e.target.name,
      e.target.name === 'repoId' ? [e.target.value] : e.target.value,
    );
  };

  return (
    <FormSection>
      <FormGroup
        id="endpoint"
        label="Endpoint"
        required
        helpErrorPosition="bottom"
        error={errors.endpoint}
        content={
          <Input
            name="endpoint"
            id="endpoint"
            type="text"
            value={formState.endpoint}
            placeholder="ws://path.to.my.miria"
            onChange={onFormItemChange}
            onBlur={onBlur}
            autoComplete="off"
          />
        }
      />

      <FormGroup
        id="username"
        label="Username"
        required
        helpErrorPosition="bottom"
        error={errors.username}
        content={
          <Input
            name="username"
            id="username"
            type="text"
            placeholder=""
            value={formState.username}
            onChange={onFormItemChange}
            onBlur={onBlur}
            autoComplete="off"
          />
        }
      />

      <FormGroup
        id="password"
        label="Password"
        required
        helpErrorPosition="bottom"
        error={errors.password}
        content={
          <Input
            name="password"
            id="password"
            type="password"
            placeholder=""
            value={formState.password}
            onChange={onFormItemChange}
            onBlur={onBlur}
            autoComplete="off"
          />
        }
      />

      <FormGroup
        id="repoId"
        label="Atempo Miria Repository"
        required
        helpErrorPosition="bottom"
        error={errors.repoId}
        content={
          <Input
            id="repoId"
            name="repoId"
            type="text"
            placeholder=""
            value={formState.repoId[0]}
            onChange={onFormItemChange}
            onBlur={onBlur}
            autoComplete="off"
          />
        }
      />
    </FormSection>
  );
}
