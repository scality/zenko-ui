import { ISVPlatformConfig } from '../../types';
import { VeeamLogo } from '../../../ui-elements/Veeam/VeeamLogo';
import Joi from '@hapi/joi';
import { Text } from '@scality/core-ui';
import { ListItem } from '../index';
import { accountNameValidationSchema } from '../../../account/AccountCreate';
import { bucketNameValidationSchema } from '../../../databrowser/buckets/BucketCreate';
import { VEEAM_OFFICE_365_V8 } from '../../constants';

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

export const VeeamVBO: ISVPlatformConfig = {
  id: 'veeam-vbo',
  name: 'Veeam',
  logo: <VeeamLogo />,
  description: 'Prepare ARTESCA for ',
  bucketTag: 'veeam-backup',
  skipModalContent: (
    <Text>
      To start Veeam assistant configuration again, you can go to the{' '}
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
