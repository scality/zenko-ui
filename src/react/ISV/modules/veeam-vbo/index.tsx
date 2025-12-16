import { ISVCardConfig, ISVInfo, ISVPlatformConfig } from '../../types';
import { VeeamLogo } from '../veeam/components/VeeamLogo';
import Joi from '@hapi/joi';
import { FormGroup, Stack, Text } from '@scality/core-ui';
import { ListItem } from '../index';
import { accountNameValidationSchema } from '../../../account/AccountCreate';
import { bucketNameValidationSchema } from '../../utils/bucketNameValidation';
import { VEEAM_OFFICE_365, VEEAM_OFFICE_365_V8 } from '../../constants';
import { GET_VEEAM_POLICY } from '../../utils/ISVPolicy';
import { Select } from '@scality/core-ui/dist/next';
import { Controller, useFormContext } from 'react-hook-form';
import { IAMUSerTooltip } from '../../components/IAMUserTooltip';

const AccountTooltip = () => {
  return (
    <ul>
      <ListItem>
        Enter a unique ARTESCA account name, where your S3 & IAM Veeam resources
        will be structured.
      </ListItem>
      <ListItem>
        This information won’t be required by the Veeam console.
      </ListItem>
    </ul>
  );
};

const ApplicationTooltip = () => {
  return (
    <ul>
      <ListItem>Choose the Veeam application you're setting up.</ListItem>
      <ListItem>
        Features such as Immutable Backup and Max Repository Capacity (that
        provides notification via Smart Object Storage API) are only supported
        in Veeam Backup and Replication, and not in Veeam Backup for Microsoft
        365.
      </ListItem>
    </ul>
  );
};

const BucketNameTooltip = () => {
  return (
    <ul>
      <ListItem>
        This bucket is your future Veeam destination. You'll need it when
        setting up your Veeam application. We'll also include this in the
        summary provided by our Veeam assistant at the end.
      </ListItem>
      <ListItem>
        The bucket name should follow few constraints:
        <ul>
          <li>Must be unique,</li>
          <li>Cannot be modified after creation</li>
          <li>
            Bucket names can include only lowercase letters, numbers, dots (.),
            and hyphens (-).
          </li>
        </ul>
      </ListItem>
    </ul>
  );
};

const CapacityTooltip = () => {
  return (
    <ul>
      <li>Set the maximum capacity for your Veeam backup repository</li>
      <li>This will help monitor and manage your storage usage</li>
    </ul>
  );
};

const EnableImmutableBackupTooltip = () => {
  return (
    <ul>
      <ListItem>
        Veeam's Immutable Backup feature enhances data protection by using S3
        Object-lock technology.
      </ListItem>
      <ListItem>
        By selecting the Immutable Backup feature, the ARTESCA bucket is created
        with Object-lock enabled.
      </ListItem>
      <ListItem>
        Data backed up to your ARTESCA S3 bucket via Veeam will be immutable.
      </ListItem>
    </ul>
  );
};

const OfficeVersion = () => {
  const { control } = useFormContext();
  return (
    <FormGroup
      id={'application'}
      label={'Veeam application'}
      labelHelpTooltip={
        'Choose the version of Veeam Backup for Microsoft 365 you are setting up.'
      }
      helpErrorPosition="bottom"
      content={
        <Controller
          name={'application'}
          control={control}
          defaultValue={VEEAM_OFFICE_365}
          render={({ field: { onChange, value } }) => (
            <Select id={'application'} onChange={onChange} value={value}>
              {[
                {
                  key: VEEAM_OFFICE_365,
                  value: VEEAM_OFFICE_365,
                  label: VEEAM_OFFICE_365,
                },
                {
                  key: VEEAM_OFFICE_365_V8,
                  value: VEEAM_OFFICE_365_V8,
                  label: VEEAM_OFFICE_365_V8,
                },
              ].map(({ key, value, label }) => (
                <Select.Option key={key} value={value}>
                  {label}
                </Select.Option>
              ))}
            </Select>
          )}
        />
      }
    />
  );
};

export const VeeamVBOInfo: ISVInfo = {
  id: 'veeam-vbo',
  name: 'Veeam VB365',
  logo: <VeeamLogo />,
};

export const VEEAM_VBO_APPLICATION = 'Veeam Backup for Microsoft 365';

export const VeeamVBOCardInfo: ISVCardConfig = {
  ...VeeamVBOInfo,
  assistant: true,
  application: VEEAM_VBO_APPLICATION,
  documentationLink:
    '/artesca/docs/partner_applications/backup_and_archives/veeam_backup_for_ms_365.html',
};

export const VeeamVBO: ISVPlatformConfig = {
  ...VeeamVBOInfo,
  description: (
    <Stack gap="r8">
      <Text variant="Large">Prepare ARTESCA for</Text>
      <VeeamLogo />
      <Text variant="Large" isEmphazed>
        Veeam Backup for Microsoft 365
      </Text>
    </Stack>
  ),
  bucketTag: VEEAM_VBO_APPLICATION,
  getPolicy: GET_VEEAM_POLICY,
  immutabilitySummaryOverride: ({ isImmutable, application }) => ({
    label: 'Immutable Backup',
    helpText: isImmutable
      ? application === VEEAM_OFFICE_365_V8
        ? 'Ensure "Make recent backups immutable" is checked when configuring the bucket in Veeam.'
        : 'Ensure "Make backups immutable" is checked when configuring the bucket in Veeam.'
      : undefined,
  }),
  skipModalContent: (
    <Text>
      To start Veeam assistant configuration again, you can go to the{' '}
      <b>Accounts</b> page or <b>Data Browser</b> page. If the platform doesn't
      have any accounts, it will also prompt you on your next login.
    </Text>
  ),
  fieldOverrides: [
    {
      name: 'accountName',
      label: 'Account',
      placeholder: 'Enter account name',
      tooltip: <AccountTooltip />,
    },
    {
      name: 'application',
      label: 'Veeam application',
      placeholder: 'Select Veeam application',
      tooltip: <ApplicationTooltip />,
    },
    {
      name: 'bucketName',
      label: 'Bucket name',
      placeholder: 'Enter bucket name',
      tooltip: <BucketNameTooltip />,
    },
    {
      name: 'capacity',
      label: 'Repository Capacity',
      placeholder: 'Enter capacity',
      tooltip: <CapacityTooltip />,
    },
    {
      name: 'enableImmutableBackup',
      label: 'Immutable Backup',
      tooltip: <EnableImmutableBackupTooltip />,
    },
    {
      name: 'IAMUserName',
      label: 'IAM User Name',
      tooltip: <IAMUSerTooltip platform="Veeam" />,
    },
  ],
  additionalFields: [<OfficeVersion />],
  isObjectLockEnabled: (props) => props.application === VEEAM_OFFICE_365_V8,
  validator: Joi.object({
    accountName: accountNameValidationSchema,
    accountNameType: Joi.string().required(),
    IAMUserName: Joi.when('accountNameType', {
      is: Joi.equal('existing'),
      then: accountNameValidationSchema,
      otherwise: Joi.valid(),
    }),
    IAMUserNameType: Joi.when('accountNameType', {
      is: Joi.equal('existing'),
      then: Joi.string().required(),
      otherwise: Joi.valid(),
    }),
    generateKey: Joi.when('accountNameType', {
      is: Joi.equal('existing'),
      then: Joi.boolean(),
      otherwise: Joi.valid(),
    }),
    application: Joi.string().required(),
    buckets: Joi.array().items(
      Joi.object({
        name: bucketNameValidationSchema,
        tag: Joi.string(),
        capacity: Joi.valid(),
        capacityUnit: Joi.valid(),
      }),
    ),
    enableImmutableBackup: Joi.when('application', {
      is: Joi.equal(VEEAM_OFFICE_365_V8),
      then: Joi.boolean().required(),
      otherwise: Joi.valid(),
    }),
  }),
};
