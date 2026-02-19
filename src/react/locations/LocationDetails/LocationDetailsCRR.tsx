import { FormGroup, FormSection } from '@scality/core-ui';
import { Input } from '@scality/core-ui/dist/components/inputv2/inputv2';
import type React from 'react';
import { useState } from 'react';
import { EndpointInfoMessage } from '../../truststore/EndpointInfoMessage';
import { LOCATION_EDITOR_FORCED_LABEL_WIDTH } from '../LocationEditor';
import type { LocationDetailsFormProps } from '.';

type FieldNames = 'endpoint' | 'stsEndpoint' | 'accessKey' | 'secretKey';

export interface CRRDetails {
  endpoint: string;
  stsEndpoint: string;
  accessKey: string;
  secretKey: string;
}

interface State extends CRRDetails {
  editingExisting?: boolean;
}

type Errors = Record<FieldNames, string>;

type FieldConfig = {
  name: FieldNames;
  label: string;
  placeholder?: string;
  type: string;
  required: boolean;
  help?: string;
  validator: (value: string) => string;
};

const INIT_STATE: State = {
  endpoint: '',
  stsEndpoint: '',
  accessKey: '',
  secretKey: '',
};

const INIT_ERRORS: Errors = {
  endpoint: '',
  stsEndpoint: '',
  accessKey: '',
  secretKey: '',
};

export const crrValidators = {
  validateEndpoint: (endpoint: string): string => {
    if (!endpoint) return 'S3 endpoint is required';
    try {
      const url = new URL(endpoint);
      if (!url.protocol.startsWith('http')) {
        return 'Endpoint must be a valid HTTP or HTTPS URL';
      }
      return '';
    } catch (_e) {
      return 'Invalid endpoint URL format';
    }
  },

  validateStsEndpoint: (stsEndpoint: string): string => {
    if (!stsEndpoint) return 'STS endpoint is required';
    try {
      const url = new URL(stsEndpoint);
      if (!url.protocol.startsWith('http')) {
        return 'STS endpoint must be a valid HTTP or HTTPS URL';
      }
      return '';
    } catch (_e) {
      return 'Invalid STS endpoint URL format';
    }
  },

  validateAccessKey: (accessKey: string): string => {
    if (!accessKey) return 'Access key is required';
    if (accessKey.length < 16 || accessKey.length > 128) {
      return 'Access key must be between 16 and 128 characters';
    }
    return '';
  },

  validateSecretKey: (secretKey: string): string => {
    if (!secretKey) return 'Secret key is required';
    if (secretKey.length < 20) {
      return 'Secret key must be at least 20 characters long';
    }
    return '';
  },

  validateCRRDetails: (details: Partial<CRRDetails>) => {
    if (!details.endpoint || !details.stsEndpoint || !details.accessKey || !details.secretKey) {
      return {
        disable: true,
        errorMessage: '',
      };
    }

    const endpointError = crrValidators.validateEndpoint(details.endpoint);
    if (endpointError) {
      return {
        disable: true,
        errorMessage: endpointError === 'S3 endpoint is required' ? '' : endpointError,
      };
    }

    const stsEndpointError = crrValidators.validateStsEndpoint(details.stsEndpoint);
    if (stsEndpointError) {
      return {
        disable: true,
        errorMessage: stsEndpointError === 'STS endpoint is required' ? '' : stsEndpointError,
      };
    }

    return null;
  },
};

function LocationDetailsCRR({ details, onChange, editingExisting }: LocationDetailsFormProps) {
  const [formState, setFormState] = useState<State>(() => {
    const initialState = { ...Object.assign({}, INIT_STATE, details) };
    if (editingExisting) {
      initialState.secretKey = '';
    }
    return initialState;
  });
  const [errors, setErrors] = useState<Errors>(INIT_ERRORS);

  const fieldConfigs: FieldConfig[] = [
    {
      name: 'accessKey',
      label: 'Access Key',
      type: 'text',
      required: true,
      validator: crrValidators.validateAccessKey,
    },
    {
      name: 'secretKey',
      label: 'Secret Key',
      type: 'password',
      required: true,
      help: "Your credentials are encrypted in transit, then at rest using your instance's RSA key pair so that we're unable to see them.",
      validator: crrValidators.validateSecretKey,
    },
    {
      name: 'endpoint',
      label: 'S3 Endpoint',
      placeholder: 'https://s3.example.com',
      type: 'text',
      required: true,
      validator: crrValidators.validateEndpoint,
    },
    {
      name: 'stsEndpoint',
      label: 'STS Endpoint',
      placeholder: 'https://sts.example.com',
      type: 'text',
      required: true,
      help: 'The Security Token Service (STS) endpoint provides temporary credentials via role assumption, enabling secure replication access to the target cluster without permanent keys.',
      validator: crrValidators.validateStsEndpoint,
    },
  ];

  const validateField = (name: FieldNames, value: string) => {
    const field = fieldConfigs.find((f) => f.name === name);
    const error = field ? field.validator(value) : '';
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  };

  const onInternalStateChange = (key: FieldNames, value: string) => {
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

    onInternalStateChange(name, value);
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as FieldNames;
    validateField(name, e.target.value);
  };

  return (
    <FormSection forceLabelWidth={LOCATION_EDITOR_FORCED_LABEL_WIDTH}>
      {fieldConfigs.map((field) => (
        <>
          <FormGroup
            key={field.name}
            id={field.name}
            label={field.label}
            required={field.required}
            helpErrorPosition="bottom"
            error={errors[field.name]}
            labelHelpTooltip={field.help}
            content={
              <Input
                name={field.name}
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={formState[field.name]}
                onChange={onFormItemChange}
                onBlur={onBlur}
                autoComplete="off"
              />
            }
          />
          {field.name === 'endpoint' && formState.endpoint.startsWith('https') && <EndpointInfoMessage hasMargin />}
        </>
      ))}
    </FormSection>
  );
}

export default LocationDetailsCRR;
