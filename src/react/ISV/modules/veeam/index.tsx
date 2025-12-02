import { ISVCardConfig, ISVInfo, ISVPlatformConfig } from '../../types';
import { VeeamLogo } from './components/VeeamLogo';
import Joi from '@hapi/joi';
import { Banner, Stack, Text } from '@scality/core-ui';
import { checkDecimals, ListItem } from '../index';
import { accountNameValidationSchema } from '../../../account/AccountCreate';
import { bucketNameValidationSchema } from '../../../databrowser/buckets/BucketCreate';
import { VEEAM_BACKUP_REPLICATION, VEEAM_OFFICE_365 } from '../../constants';
import { GET_VEEAM_POLICY } from '../../utils/ISVPolicy';
import { useCheckSOSAPIStatus } from '../../hooks/useCheckSOSAPIStatus';
import { IAMUSerTooltip } from '../../components/IAMUserTooltip';
import { VeeamMultipleBucketCapture } from './components/VeeamMultipleBucketCapture';

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
const getVeeamVBRDisabledMessage = () => {
  const status = useCheckSOSAPIStatus();
  if (status === 'wrongAccess') {
    return (
      <Text>
        Smart Object Storage API is not available <br />
        Ensure to connect to the UI from the Management IP
      </Text>
    );
  } else if (status === 'unauthorized') {
    return (
      <Text>
        As Smart Object Storage API is not available, you need to be a platform
        admin to configure Veeam Backup and Replication. You can also contact
        your platform admin to enable the Smart Object Storage API.
      </Text>
    );
  }
};
export const VeeamInfo: ISVInfo = {
  id: 'veeam-vbr',
  name: 'Veeam',
  logo: <VeeamLogo />,
  getDisabledMessage: getVeeamVBRDisabledMessage,
};

export const VeeamCardInfo: ISVCardConfig = {
  ...VeeamInfo,
  assistant: true,
  application: VEEAM_BACKUP_REPLICATION,
  documentationLink:
    '/artesca/docs/partner_applications/backup_and_archives/veeam/index.html',
};

export const Veeam: ISVPlatformConfig = {
  ...VeeamInfo,
  description: (
    <Stack gap="r8">
      <Text variant="Large">Prepare ARTESCA for</Text>
      <VeeamLogo />
      <Text variant="Large" isEmphazed>
        Veeam Backup & Replication
      </Text>
    </Stack>
  ),
  bucketTag: VEEAM_BACKUP_REPLICATION,
  summaryBucketBanner: (
    <>
      <Banner variant="warning" title="Configuration warning">
        When configuring Veeam Backup and Replication (VBR) application, the
        option “Automatic bucket creation” must be disabled to ensure Veeam
        connects properly.
        <br />
        In VBR v12.3.1.1139 and above, Automatic Bucket Creation is enabled by
        default.
        <br />
        You'll find the option next to the Bucket name in the S3 compatible
        repository wizard.
        <VeeamMultipleBucketCapture />
      </Banner>
    </>
  ),
  skipModalContent: (
    <Text>
      To start Veeam assistant configuration again, you can go to the{' '}
      <b>Accounts</b> page or <b>Data Browser</b> page. If the platform doesn't
      have any accounts, it will also prompt you on your next login.
    </Text>
  ),
  getPolicy: GET_VEEAM_POLICY,
  fieldOverrides: [
    {
      name: 'accountName',
      label: 'Account',
      placeholder: 'Enter account name',
      tooltip: <AccountTooltip />,
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
  immutabilitySummaryOverride: ({ isImmutable }) => ({
    label: 'Immutable Backup',
    helpText: isImmutable
      ? 'Ensure "Make recent backups immutable" is checked when configuring the bucket in Veeam.'
      : undefined,
  }),
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
    enableImmutableBackup: Joi.boolean().required().default(false),
    autoCreateRepository: Joi.boolean().optional(),
    immutablePeriodDays: Joi.when('autoCreateRepository', {
      is: true,
      then: Joi.number().integer().min(1).max(3650).optional(),
      otherwise: Joi.valid(),
    }),
    buckets: Joi.array().items(
      Joi.object({
        name: bucketNameValidationSchema,
        tag: Joi.string(),
        capacity: Joi.when('application', {
          is: Joi.not(VEEAM_OFFICE_365),
          then: Joi.number()
            .required()
            .min(1)
            .max(1024)
            .custom((value, helpers) => checkDecimals(value, helpers))
            .label('Capacity'),
          otherwise: Joi.valid(),
        }),
        capacityUnit: Joi.when('application', {
          is: Joi.not(VEEAM_OFFICE_365),
          then: Joi.string().required(),
          otherwise: Joi.valid(),
        }),
      }),
    ),
  }),
};
