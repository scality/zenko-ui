import {
  Checkbox,
  CheckboxContainer,
  WarningInput,
  Fieldset,
  Input,
  Label,
} from '../../../ui-elements/FormLayout';
import { HelpLocationCreationAsyncNotification } from '../../../ui-elements/Help';
import React, { useEffect, useState } from 'react';
import { isIngestSource } from '../../../utils/storageOptions';
import { storageOptions } from './storageOptions';
import { useSelector } from 'react-redux';
import type { AppState } from '../../../../types/state';
import { XDM_FEATURE } from '../../../../js/config';
import SpacedBox from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import { LocationDetailsFormProps } from '.';
type State = {
  bucketMatch: boolean;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  endpoint: string;
};
const INIT_STATE: State = {
  bucketMatch: false,
  accessKey: '',
  secretKey: '',
  bucketName: '',
  endpoint: '',
};
export default function LocationDetailsAwsCustom({
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

  //TODO check why the tests expect onChange to be called on mount
  useEffect(() => {
    onChange(formState);
  }, []);
  const isIngest = isIngestSource(storageOptions, locationType, capabilities);
  const features = useSelector((state: AppState) => state.auth.config.features);
  return (
    <div>
      <Fieldset>
        <Label htmlFor="accessKey">Access Key</Label>
        <Input
          name="accessKey"
          id="accessKey"
          type="text"
          placeholder="AKI5HMPCLRB86WCKTN2C"
          value={formState.accessKey}
          onChange={onFormItemChange}
          autoComplete="off"
        />
      </Fieldset>
      <Fieldset>
        <Label htmlFor="secretKey">Secret Key</Label>
        <Input
          name="secretKey"
          id="secretKey"
          type="password"
          placeholder="QFvIo6l76oe9xgCAw1N/zlPFtdTSZXMMUuANeXc6"
          value={formState.secretKey}
          onChange={onFormItemChange}
          autoComplete="new-password"
        />
        <small>
          Your credentials are encrypted in transit, then at rest using your
          instance&apos;s RSA key pair so that we&apos;re unable to see them.
        </small>
      </Fieldset>
      <Fieldset>
        <Label htmlFor="bucketName">Target Bucket Name</Label>
        <Input
          name="bucketName"
          id="bucketName"
          type="text"
          placeholder="Target Bucket Name"
          value={formState.bucketName}
          onChange={onFormItemChange}
          autoComplete="off"
          disabled={editingExisting}
        />
      </Fieldset>
      <Fieldset>
        <Label htmlFor="endpoint">Endpoint</Label>
        <Input
          name="endpoint"
          type="text"
          value={formState.endpoint}
          onChange={onFormItemChange}
          autoComplete="off"
          placeholder="https://hosted-s3-server.internal.example.com:4443"
        />
        <small>
          Endpoint to reach the S3 server, including scheme and port. The
          buckets will have a path-style access.
        </small>
      </Fieldset>
      {(isIngest && features.includes(XDM_FEATURE)) || !isIngest ? (
        <Fieldset>
          <CheckboxContainer>
            <Checkbox
              name="bucketMatch"
              disabled={editingExisting}
              value={formState.bucketMatch}
              checked={formState.bucketMatch}
              onChange={onFormItemChange}
            />
            <span>
              {isIngest ? (
                <>
                  {' '}
                  Async Metadata updates Ready{' '}
                  <HelpLocationCreationAsyncNotification />{' '}
                </>
              ) : (
                'Write objects without prefix'
              )}
            </span>
          </CheckboxContainer>
          <small>
            Your objects will be stored in the target bucket without a
            source-bucket prefix.
          </small>
          <WarningInput hasError={!!formState.bucketMatch}>
            <small>
              Storing multiple buckets in a location with this option enabled
              can lead to data loss.
            </small>
          </WarningInput>
        </Fieldset>
      ) : (
        <SpacedBox mb={8} />
      )}
    </div>
  );
}
