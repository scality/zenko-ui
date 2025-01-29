import { ISVPlatformConfig } from '../../types';
import Joi from '@hapi/joi';
import { Text } from '@scality/core-ui';
import { ListItem } from '..';
import { accountNameValidationSchema } from '../../../account/AccountCreate';
import { bucketNameValidationSchema } from '../../../databrowser/buckets/BucketCreate';
import { CommvaultLogo } from './components/CommvaultLogo';

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

export const Commvault: ISVPlatformConfig = {
  id: 'commvault',
  name: 'COMMVAULT',
  logo: <CommvaultLogo />,
  description: 'Configure ARTESCA for ',
  bucketTag: 'commvault-backup',
  skipModalContent: (
    <Text>
      To start COMMVAULT assistant configuration again, you can go to the{' '}
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
      label: 'COMMVAULT application',
      placeholder: 'Select COMMVAULT application',
      tooltip: (
        <ul>
          <ListItem>
            Choose the COMMVAULT application you're setting up.
          </ListItem>
          <ListItem>
            Features such as Immutable Backup and Max Repository Capacity (that
            provides notification via Smart Object Storage API) are only
            supported in COMMVAULT, and not in COMMVAULT.
          </ListItem>
        </ul>
      ),
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
    enableImmutableBackup: Joi.boolean().default(true),
    buckets: Joi.array().items(
      Joi.object({
        name: bucketNameValidationSchema,
        tag: Joi.string(),
      }),
    ),
  }),
};
