import { ISVPlatformConfig } from '../../types';
import { VeeamLogo } from '../../../ui-elements/Veeam/VeeamLogo';
import Joi from '@hapi/joi';
import { Text } from '@scality/core-ui';
import { checkDecimals, ListItem } from '../index';
import { accountNameValidationSchema } from '../../../account/AccountCreate';
import { bucketNameValidationSchema } from '../../../databrowser/buckets/BucketCreate';

export const Veeam: ISVPlatformConfig = {
  id: 'veeam',
  name: 'Veeam',
  logo: <VeeamLogo />,
  description: 'Configure ARTESCA for Veeam',
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
      tooltip: (
        <ul>
          <ListItem>
            Enter a unique ARTESCA account name, where your S3 & IAM Veeam
            resources will be structured.
          </ListItem>
          <ListItem>
            This information won’t be required by the Veeam console.
          </ListItem>
        </ul>
      ),
    },
    {
      name: 'application',
      label: 'Veeam application',
      placeholder: 'Select Veeam application',
      tooltip: (
        <ul>
          <ListItem>Choose the Veeam application you're setting up.</ListItem>
          <ListItem>
            Features such as Immutable Backup and Max Repository Capacity (that
            provides notification via Smart Object Storage API) are only
            supported in Veeam Backup and Replication, and not in Veeam Backup
            for Microsoft 365.
          </ListItem>
        </ul>
      ),
    },
    {
      name: 'bucketName',
      label: 'Bucket name',
      placeholder: 'Enter bucket name',
      tooltip: (
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
                Bucket names can include only lowercase letters, numbers, dots
                (.), and hyphens (-).
              </li>
            </ul>
          </ListItem>
        </ul>
      ),
    },
    {
      name: 'capacity',
      label: 'Repository Capacity',
      placeholder: 'Enter capacity',
      tooltip: (
        <ul>
          <li>Set the maximum capacity for your Veeam backup repository</li>
          <li>This will help monitor and manage your storage usage</li>
        </ul>
      ),
    },
    {
      name: 'enableImmutableBackup',
      label: 'Immutable Backup',
      tooltip: (
        <ul>
          <ListItem>
            Veeam's Immutable Backup feature enhances data protection by using
            S3 Object-lock technology.
          </ListItem>
          <ListItem>
            By selecting the Immutable Backup feature, the ARTESCA bucket is
            created with Object-lock enabled.
          </ListItem>
          <ListItem>
            Data backed up to your ARTESCA S3 bucket via Veeam will be
            immutable.
          </ListItem>
        </ul>
      ),
    },
  ],
  validator: Joi.object({
    accountName: accountNameValidationSchema,
    bucketName: bucketNameValidationSchema,
    application: Joi.string().required(),
    capacity: Joi.alternatives().try(
      Joi.number()
        .min(1)
        .max(1024)
        .custom((value, helpers) => checkDecimals(value, helpers)),
      Joi.string().valid('0'),
    ),
    capacityUnit: Joi.string().valid('TB', 'GB'),
    enableImmutableBackup: Joi.boolean().default(true),
  }),
};
