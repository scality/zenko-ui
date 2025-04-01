import { FormGroup, FormSection } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/components/inputv2/inputv2';
import React, { useState } from 'react';
import { LocationDetailsFormProps } from '.';

type FieldNames = 'endpoint' | 'repoId' | 'username' | 'password';
export interface TapeMiriaDetails {
  endpoint: string;
  repoId: string[];
  username: string;
  password: string;
}
interface State extends TapeMiriaDetails {
  editingExisting?: boolean;
}

type Errors = Record<FieldNames, string>;

type FieldConfig = {
  name: FieldNames;
  label: string;
  placeholder: string;
  type: string;
  required: boolean;
  isArray?: boolean;
  validator: (value: string | string[]) => string;
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

export const tapeMiriaValidators = {
  validateEndpoint: (endpoint: string): string => {
    if (!endpoint) return 'Endpoint is required';
    try {
      new URL(endpoint);
      return '';
    } catch (e) {
      return 'Invalid endpoint URL format';
    }
  },

  validateUsername: (username: string): string => {
    return !username ? 'Username is required' : '';
  },

  validatePassword: (password: string): string => {
    return !password ? 'Password is required' : '';
  },

  validateRepoId: (repoId: string[]): string => {
    return !repoId?.length || !repoId[0]
      ? 'Atempo Miria Repository is required'
      : '';
  },

  validateTapeMiriaDetails: (details: Partial<TapeMiriaDetails>) => {
    if (
      !details.endpoint ||
      !details.username ||
      !details.password ||
      !details.repoId?.length ||
      !details.repoId[0]
    ) {
      return {
        disable: true,
        errorMessage: '',
      };
    }

    const endpointError = tapeMiriaValidators.validateEndpoint(
      details.endpoint,
    );
    if (endpointError) {
      return {
        disable: true,
        errorMessage:
          endpointError === 'Endpoint is required'
            ? ''
            : 'Invalid endpoint URL format',
      };
    }

    return null;
  },
};

export default function LocationDetailsTapeMiria({
  details,
  onChange,
  editingExisting,
}: LocationDetailsFormProps) {
  const [formState, setFormState] = useState<State>(() => {
    const initialState = { ...Object.assign({}, INIT_STATE, details) };
    if (editingExisting) {
      initialState.password = '';
    }
    return initialState;
  });
  const [errors, setErrors] = useState<Errors>(INIT_ERRORS);

  const fieldConfigs: FieldConfig[] = [
    {
      name: 'endpoint',
      label: 'Endpoint',
      placeholder: 'ws://path.to.my.miria',
      type: 'text',
      required: true,
      validator: tapeMiriaValidators.validateEndpoint,
    },
    {
      name: 'username',
      label: 'Username',
      placeholder: '',
      type: 'text',
      required: true,
      validator: tapeMiriaValidators.validateUsername,
    },
    {
      name: 'password',
      label: 'Password',
      placeholder: '',
      type: 'password',
      required: true,
      validator: tapeMiriaValidators.validatePassword,
    },
    {
      name: 'repoId',
      label: 'Atempo Miria Repository',
      placeholder: '',
      type: 'text',
      required: true,
      isArray: true,
      validator: tapeMiriaValidators.validateRepoId,
    },
  ];

  const validateField = (name: FieldNames, value: string | string[]) => {
    const field = fieldConfigs.find((f) => f.name === name);
    const error = field ? field.validator(value) : '';
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const onInternalStateChange = (key: FieldNames, value: string | string[]) => {
    setFormState({ ...formState, [key]: value });
    validateField(key, value);

    if (onChange) {
      onChange({ ...formState, [key]: value });
    }
  };

  const onFormItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const name = target.name as FieldNames;
    const value = target.value;
    const field = fieldConfigs.find((f) => f.name === name);

    onInternalStateChange(
      name,
      field?.isArray ? [value as string] : (value as string),
    );
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as FieldNames;
    const field = fieldConfigs.find((f) => f.name === name);

    validateField(name, field?.isArray ? [e.target.value] : e.target.value);
  };

  return (
    <FormSection>
      {fieldConfigs.map((field) => (
        <FormGroup
          key={field.name}
          id={field.name}
          label={field.label}
          required={field.required}
          helpErrorPosition="bottom"
          error={errors[field.name]}
          content={
            <Input
              name={field.name}
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={
                field.isArray ? formState[field.name][0] : formState[field.name]
              }
              onChange={onFormItemChange}
              onBlur={onBlur}
              autoComplete="off"
            />
          }
        />
      ))}
    </FormSection>
  );
}
