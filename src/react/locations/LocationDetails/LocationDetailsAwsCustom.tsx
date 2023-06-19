import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Input } from '@scality/core-ui/dist/next';
import { HelpLocationCreationAsyncNotification } from '../../ui-elements/Help';
import { isIngestSource } from '../../utils/storageOptions';
import { storageOptions } from './storageOptions';
import type { AppState } from '../../../types/state';
import { XDM_FEATURE } from '../../../js/config';
import { LocationDetailsFormProps } from '.';

import {
  JAGUAR_S3_ENDPOINT,
  JAGUAR_S3_LOCATION_KEY,
  LocationTypeKey,
  ORANGE_S3_ENDPOINT,
  ORANGE_S3_LOCATION_KEY,
  OUTSCALE_PUBLIC_S3_ENDPOINT,
  OUTSCALE_PUBLIC_S3_LOCATION_KEY,
  OUTSCALE_SNC_S3_ENDPOINT,
  OUTSCALE_SNC_S3_LOCATION_KEY,
} from '../../../types/config';
import { checkIsRingS3Reseller } from '../utils';
import {
  Checkbox,
  FormGroup,
  FormSection,
  Stack,
  Text,
} from '@scality/core-ui';

const computeInitialEndpoint = (locationType: LocationTypeKey) => {
  if (locationType === JAGUAR_S3_LOCATION_KEY) {
    return { endpoint: JAGUAR_S3_ENDPOINT };
  } else if (locationType === ORANGE_S3_LOCATION_KEY) {
    return { endpoint: ORANGE_S3_ENDPOINT };
  } else if (locationType === OUTSCALE_PUBLIC_S3_LOCATION_KEY) {
    return { endpoint: OUTSCALE_PUBLIC_S3_ENDPOINT };
  } else if (locationType === OUTSCALE_SNC_S3_LOCATION_KEY) {
    return { endpoint: OUTSCALE_SNC_S3_ENDPOINT };
  } else {
    return {};
  }
};

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
  const [formState, setFormState] = useState<State>(() => {
    return {
      ...Object.assign(
        {},
        INIT_STATE,
        details,
        computeInitialEndpoint(locationType),
        { secretKey: '' },
      ),
    };
  });

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
  const isRingS3Reseller = checkIsRingS3Reseller(locationType);

  return (
    <>
      <FormSection>
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
          labelHelpTooltip="Your credentials are encrypted in transit, then at rest using your
          instance's RSA key pair so that we're unable to see them."
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

        {!isRingS3Reseller ? (
          <FormGroup
            content={
              <Input
                name="endpoint"
                type="text"
                value={formState.endpoint}
                onChange={onFormItemChange}
                autoComplete="off"
                placeholder="https://hosted-s3-server.internal.example.com:4443"
              />
            }
            label="Endpoint"
            id="endpoint"
            required
            labelHelpTooltip="Endpoint to reach the S3 server, including scheme and port. The
        buckets will have a path-style access."
            helpErrorPosition="bottom"
          />
        ) : (
          <></>
        )}
      </FormSection>
      {(isIngest && features.includes(XDM_FEATURE)) || !isIngest ? (
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
                label={
                  isIngest ? (
                    <>
                      Async Metadata updates Ready{' '}
                      <HelpLocationCreationAsyncNotification />{' '}
                    </>
                  ) : (
                    'Write objects without prefix'
                  )
                }
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
      ) : null}
    </>
  );
}
