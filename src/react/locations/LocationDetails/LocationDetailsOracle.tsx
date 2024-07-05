import { Input } from '@scality/core-ui/dist/components/inputv2/inputv2';
import React, { useEffect, useState } from 'react';
import { LocationDetailsFormProps } from '.';
import {
  FormGroup,
  FormSection,
} from '@scality/core-ui/dist/components/form/Form.component';
import { Checkbox } from '@scality/core-ui/dist/components/checkbox/Checkbox.component';

type State = {
  bucketMatch: boolean;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  namespace: string;
  region: string;
  endpoint: string;
};
const INIT_STATE: State = {
  bucketMatch: false,
  accessKey: '',
  secretKey: '',
  bucketName: '',
  namespace: '',
  region: '',
  endpoint: '',
};

export const oracleCloudEndpointBuilder = (namespace: string, region: string) =>
  `https://${namespace}.compat.objectstorage.${region}.oraclecloud.com`;

export const getNamespaceAndRegion = (endpoint: string) => {
  if (!endpoint) return { namespace: '', region: '' };
  const regex =
    /https:\/\/(?<namespace>.+)\.compat\.objectstorage\.(?<region>.+).oraclecloud.com/;
  const parts = endpoint.match(regex);
  return {
    namespace: parts.groups['namespace'],
    region: parts.groups['region'],
  };
};

export default function LocationDetailsOracle({
  details,
  editingExisting,
  onChange,
}: LocationDetailsFormProps) {
  const [formState, setFormState] = useState<State>(() => {
    return {
      ...Object.assign({}, INIT_STATE, details, {
        secretKey: '',
        ...getNamespaceAndRegion(details.endpoint),
      }),
    };
  });
  const onFormItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    if (target.name === 'namespace' || target.name === 'region') {
      setFormState({
        ...formState,
        [target.name]: value,
        endpoint: oracleCloudEndpointBuilder(
          target.name === 'namespace' ? (value as string) : formState.namespace,
          target.name === 'region' ? (value as string) : formState.region,
        ),
      });
    } else {
      setFormState({ ...formState, [target.name]: value });
    }

    if (onChange) {
      //remove the namespace and region from the formState
      //as it is not part of the LocationS3Details
      const { namespace, region, ...rest } = formState;
      onChange({ ...rest, [target.name]: value });
    }
  };

  //TODO check why the tests expect onChange to be called on mount
  useEffect(() => {
    const { namespace, region, ...rest } = formState;
    onChange({ ...rest, endpoint: formState.endpoint });
  }, []);

  return (
    <>
      <FormSection>
        <FormGroup
          id="namespace"
          label="Namespace"
          content={
            <Input
              id="namespace"
              name="namespace"
              type="text"
              value={formState.namespace}
              onChange={onFormItemChange}
              placeholder="object_storage_namespace"
            />
          }
          required
          labelHelpTooltip="The namespace of the object storage."
          helpErrorPosition="bottom"
        />
        <FormGroup
          id="region"
          label="Region"
          content={
            <Input
              id="region"
              name="region"
              type="text"
              value={formState.region}
              onChange={onFormItemChange}
              placeholder="eu-paris-1"
            />
          }
          required
          labelHelpTooltip="The region of the object storage."
          helpErrorPosition="bottom"
        />
        <FormGroup
          id="accessKey"
          content={
            <Input
              name="accessKey"
              id="accessKey"
              type="text"
              placeholder="AKI5HMPCLRB86WCKTN2C"
              value={formState.accessKey}
              onChange={onFormItemChange}
              autoComplete="off"
            />
          }
          required
          label="Access Key"
          helpErrorPosition="bottom"
        />

        <FormGroup
          id="secretKey"
          label="Secret Key"
          required
          labelHelpTooltip="Your credentials are encrypted in transit, then at rest using your instance's RSA key pair so that we're unable to see them."
          helpErrorPosition="bottom"
          content={
            <Input
              name="secretKey"
              id="secretKey"
              type="password"
              placeholder="QFvIo6l76oe9xgCAw1N/zlPFtdTSZXMMUuANeXc6"
              value={formState.secretKey}
              onChange={onFormItemChange}
              autoComplete="new-password"
            />
          }
        />
        <FormGroup
          id="bucketName"
          label="Target Bucket Name"
          help="The Target Bucket on your location needs to have Versioning enabled."
          required
          content={
            <Input
              name="bucketName"
              id="bucketName"
              type="text"
              placeholder="bucket-name"
              value={formState.bucketName}
              onChange={onFormItemChange}
              autoComplete="off"
              disabled={editingExisting}
            />
          }
          helpErrorPosition="bottom"
        />
      </FormSection>
      <FormSection>
        <FormGroup
          label=""
          direction="vertical"
          id="bucketMatch"
          content={
            <Checkbox
              name="bucketMatch"
              disabled={editingExisting}
              checked={formState.bucketMatch}
              onChange={onFormItemChange}
              label={'Write objects without prefix'}
            />
          }
          helpErrorPosition="bottom"
          help="Your objects will be stored in the target bucket without a source-bucket prefix."
          error={
            formState.bucketMatch
              ? 'Storing multiple buckets in a location with this option enabled can lead to data loss.'
              : undefined
          }
        />
      </FormSection>
    </>
  );
}
