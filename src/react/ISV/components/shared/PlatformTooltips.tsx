/**
 * Shared Tooltip Components for ISV Platforms
 *
 * These tooltips are used across multiple platforms with minor text variations.
 * Using a parameterized approach to avoid duplication.
 */

import { ListItem } from './StyledComponents';

type PlatformName = 'Veeam' | 'Commvault' | 'Kasten';

/**
 * Account name tooltip - explains the purpose of the account field
 */
export const AccountTooltip = ({ platform }: { platform: PlatformName }) => (
  <ul>
    <ListItem>
      Enter a unique ARTESCA account name, where your S3 & IAM {platform}{' '}
      resources will be structured.
    </ListItem>
    <ListItem>
      This information won't be required by the {platform} console.
    </ListItem>
  </ul>
);

/**
 * Bucket name tooltip - explains bucket naming rules
 */
export const BucketNameTooltip = ({ platform }: { platform: PlatformName }) => (
  <ul>
    <ListItem>
      This bucket is your future {platform} destination. You'll need it when
      setting up your {platform} application. We'll also include this in the
      summary provided by our {platform} assistant at the end.
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

/**
 * Immutable backup tooltip for Veeam platforms
 */
export const VeeamImmutableBackupTooltip = () => (
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

/**
 * WORM tooltip for Commvault
 */
export const CommvaultWORMTooltip = () => (
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

/**
 * Immutable backup tooltip for Kasten
 */
export const KastenImmutableBackupTooltip = () => (
  <ul>
    <ListItem>
      Kasten's Immutable Backup feature enhances data protection by using S3
      Object-lock technology.
    </ListItem>
    <ListItem>
      By selecting the Immutable Backup feature, the ARTESCA bucket is created
      with Object-lock enabled.
    </ListItem>
    <ListItem>
      Data backed up to your ARTESCA S3 bucket via Kasten will be immutable.
    </ListItem>
  </ul>
);

/**
 * Capacity tooltip for Veeam VBR (used in bucket array field overrides)
 */
export const CapacityTooltip = () => (
  <ul>
    <ListItem>
      Set your ARTESCA storage capacity limit to be monitored by Veeam (via
      Smart Object Storage API).
    </ListItem>
    <ListItem>
      Keep in mind, going over this limit has no effect on ARTESCA itself, but
      it does trigger a warning in the Veeam UI and can potentially stop backup
      activities.
    </ListItem>
  </ul>
);

/**
 * Capacity tooltip with 80% prefill note (used in VeeamCapacityFormSection)
 */
export const VeeamCapacityTooltip = () => (
  <ul>
    <ListItem>
      Set your ARTESCA storage capacity limit to be monitored by Veeam (via
      Smart Object Storage API).
    </ListItem>
    <ListItem>
      Keep in mind, going over this limit has no effect on ARTESCA itself, but
      it does trigger a warning in the Veeam UI and can potentially stop backup
      activities.
    </ListItem>
    <ListItem>
      Prefilled at 80% of the ARTESCA platform's capacity (recommended).
    </ListItem>
  </ul>
);

/**
 * Application selector tooltip for Veeam VBO
 */
export const ApplicationTooltip = () => (
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

