import { ISVCardConfig, ISVInfo, ISVPlatformConfig } from '../../types';
import Joi from '@hapi/joi';
import { Text } from '@scality/core-ui';
import { ListItem } from '..';
import { accountNameValidationSchema } from '../../../account/AccountCreate';
import { bucketNameValidationSchema } from '../../../databrowser/buckets/BucketCreate';
import { CommvaultLogo } from './components/CommvaultLogo';
import { GET_COMMVAULT_POLICY } from '../../utils/ISVPolicy';

const AccountTooltip = () => {
  return (
    <ul>
      <ListItem>
        Enter a unique ARTESCA account name, where your S3 & IAM Commvault
        resources will be structured.
      </ListItem>
      <ListItem>
        This information won’t be required by the Commvault console.
      </ListItem>
    </ul>
  );
};

const BucketNameTooltip = () => {
  return (
    <ul>
      <ListItem>
        This bucket is your future Commvault destination. You'll need it when
        setting up your Commvault application. We'll also include this in the
        summary provided by our Commvault assistant at the end.
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
        Commvault's WORM feature enhances data protection by using S3
        Object-lock technology.
      </ListItem>
      <ListItem>
        By selecting the WORM feature, the ARTESCA bucket is created with
        Object-lock enabled.
      </ListItem>
      <ListItem>
        Data backed up to your ARTESCA S3 bucket via Commvault will be
        immutable.
      </ListItem>
    </ul>
  );
};

const CommvaultInfo: ISVInfo = {
  id: 'commvault',
  name: 'Commvault',
  logo: <CommvaultLogo />,
};

export const CommvaultCardInfo: ISVCardConfig = {
  assistant: true,
  ...CommvaultInfo,
  documentationLink:
    '/docs/partner_applications/validated_designs/commvault.html',
};

export const Commvault: ISVPlatformConfig = {
  ...CommvaultInfo,
  description: 'Prepare ARTESCA for ',
  bucketTag: 'Commvault',
  getPolicy: GET_COMMVAULT_POLICY,
  immutabilitySummaryOverride: () => ({
    label: 'WORM Storage lock',
  }),
  skipModalContent: (
    <Text>
      To start Commvault assistant configuration again, you can go to the{' '}
      <b>Accounts</b> page. If the platform doesn't have any accounts, it will
      also prompt you on your next login.
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
      label: 'WORM bucket',
      tooltip: <EnableImmutableBackupTooltip />,
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
