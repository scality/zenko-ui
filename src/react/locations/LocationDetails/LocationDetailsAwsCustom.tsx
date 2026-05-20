import { Checkbox } from '@scality/core-ui/dist/components/checkbox/Checkbox.component';
import { FormGroup, FormSection } from '@scality/core-ui/dist/components/form/Form.component';
import { Input } from '@scality/core-ui/dist/components/inputv2/inputv2';
import { Box } from '@scality/core-ui/dist/next';
import type React from 'react';
import { useEffect, useState } from 'react';
import { XDM_FEATURE } from '../../../js/config';
import {
  JAGUAR_S3_ENDPOINT,
  JAGUAR_S3_LOCATION_KEY,
  type LocationTypeKey,
  ORANGE_S3_ENDPOINT,
  ORANGE_S3_LOCATION_KEY,
  OUTSCALE_PUBLIC_S3_ENDPOINT,
  OUTSCALE_PUBLIC_S3_LOCATION_KEY,
  OUTSCALE_SNC_S3_ENDPOINT,
  OUTSCALE_SNC_S3_LOCATION_KEY,
} from '../../../types/config';
import { useConfig } from '../../next-architecture/ui/ConfigProvider';
import { EndpointInfoMessage } from '../../truststore/EndpointInfoMessage';
import { HelpLocationCreationAsyncNotification } from '../../ui-elements/Help';
import { isIngestSource } from '../../utils/storageOptions';
import { ACCESS_KEY_PLACEHOLDER, LOCATION_EDITOR_FORCED_LABEL_WIDTH, S3_ENDPOINT_PATH_STYLE_TOOLTIP, SECRET_KEY_PLACEHOLDER, WRITE_OBJECTS_WITHOUT_PREFIX_HELP, WRITE_OBJECTS_WITHOUT_PREFIX_LABEL } from '../LocationEditor';
import { checkIsRingS3Reseller } from '../utils';
import type { LocationDetailsFormProps } from '.';
import { storageOptions } from './storageOptions';

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
      ...Object.assign({}, INIT_STATE, details, computeInitialEndpoint(locationType), { secretKey: '' }),
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
  const { features } = useConfig();
  const isRingS3Reseller = checkIsRingS3Reseller(locationType);

  return (
    <>
      <FormSection forceLabelWidth={LOCATION_EDITOR_FORCED_LABEL_WIDTH}>
        <FormGroup
          id="accessKey"
          content={
            <Input
              name="accessKey"
              id="accessKey"
              type="text"
              placeholder={ACCESS_KEY_PLACEHOLDER}
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
              placeholder={SECRET_KEY_PLACEHOLDER}
              value={formState.secretKey}
              onChange={onFormItemChange}
              autoComplete="new-password"
            />
          }
        />

        <Box
          // Box to force the width of helper text
          style={{
            maxWidth: `calc(20.5rem + 2rem + ${LOCATION_EDITOR_FORCED_LABEL_WIDTH}px)`,
          }}
        >
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
        </Box>

        {!isRingS3Reseller ? (
          <>
            <FormGroup
              content={
                <Input
                  name="endpoint"
                  id="endpoint"
                  type="text"
                  value={formState.endpoint}
                  onChange={onFormItemChange}
                  autoComplete="off"
                  placeholder="https://s3.example.com"
                />
              }
              label="Endpoint"
              id="endpoint"
              required
              labelHelpTooltip={S3_ENDPOINT_PATH_STYLE_TOOLTIP}
              helpErrorPosition="bottom"
            />
            {formState.endpoint.startsWith('https') && <EndpointInfoMessage />}
          </>
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
                //@ts-expect-error fix this when you are working on it
                label={
                  isIngest ? (
                    <>
                      Async Metadata updates Ready <HelpLocationCreationAsyncNotification />{' '}
                    </>
                  ) : (
                    WRITE_OBJECTS_WITHOUT_PREFIX_LABEL
                  )
                }
              />
            }
            helpErrorPosition="bottom"
            help={WRITE_OBJECTS_WITHOUT_PREFIX_HELP}
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
