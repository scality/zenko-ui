import { ISVCardConfig, ISVInfo, ISVPlatformConfig } from '../../types';
import Joi from '@hapi/joi';
import { Stack, Text } from '@scality/core-ui';
import { ListItem } from '..';
import { accountNameValidationSchema } from '../../../account/AccountCreate';
import { bucketNameValidationSchema } from '../../../databrowser/buckets/BucketCreate';
import CteraLogo from '../../components/Modal/Logos/CteraLogo';
// import { GET_CTERA_POLICY } from '../../utils/ISVPolicy';
import { IAMUSerTooltip } from '../../components/IAMUserTooltip';
import { GET_COMMVAULT_POLICY } from '../../utils/ISVPolicy';

const AccountTooltip = () => {
  return (
    <ul>
      <ListItem>
        Enter a unique ARTESCA account name, where your S3 & IAM CTERA resources
        will be structured.
      </ListItem>
      <ListItem>
        This information won't be required by the CTERA console.
      </ListItem>
    </ul>
  );
};

const BucketNameTooltip = () => {
  return (
    <ul>
      <ListItem>
        This bucket is your future CTERA destination. You'll need it when
        setting up your CTERA application. We'll also include this in the
        summary provided by our CTERA assistant at the end.
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

const EnableImmutableBackupTooltip = () => {
  return (
    <ul>
      <ListItem>
        CTERA's immutable backup feature enhances data protection by using S3
        Object-lock technology.
      </ListItem>
      <ListItem>
        By selecting the immutable backup feature, the ARTESCA bucket is created
        with Object-lock enabled.
      </ListItem>
      <ListItem>
        Data backed up to your ARTESCA S3 bucket via CTERA will be immutable.
      </ListItem>
    </ul>
  );
};

const CteraInfo: ISVInfo = {
  id: 'ctera',
  name: 'CTERA',
  logo: <CteraLogo />,
};

export const CteraCardInfo: ISVCardConfig = {
  assistant: true,
  ...CteraInfo,
  documentationLink: '/docs/partner_applications/validated_designs/ctera.html',
};

export const Ctera: ISVPlatformConfig = {
  ...CteraInfo,
  description: (
    <Stack gap="r8">
      <Text variant="Large">Prepare ARTESCA for</Text>
      <CteraLogo />
    </Stack>
  ),
  bucketTag: 'CTERA',
  getPolicy: GET_COMMVAULT_POLICY,
  immutabilitySummaryOverride: () => ({
    label: 'Immutable Backup',
  }),
  skipModalContent: (
    <Text>
      To start CTERA assistant configuration again, you can go to the{' '}
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
      name: 'bucketName',
      label: 'Bucket name',
      placeholder: 'Enter bucket name',
      tooltip: <BucketNameTooltip />,
    },

    {
      name: 'enableImmutableBackup',
      label: 'Immutable Backup',
      tooltip: <EnableImmutableBackupTooltip />,
    },
    {
      name: 'IAMUserName',
      label: 'IAM User Name',
      tooltip: <IAMUSerTooltip platform="CTERA" />,
    },
  ],

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
    enableImmutableBackup: Joi.boolean().required(),
    buckets: Joi.array().items(
      Joi.object({
        name: bucketNameValidationSchema,
        tag: Joi.string(),
        capacity: Joi.valid(),
        capacityUnit: Joi.valid(),
      }),
    ),
  }),
};
