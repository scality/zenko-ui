/**
 * Action Registry
 *
 * Provides action descriptions and validation utilities.
 * The actual action -> hook mapping is done in the component layer.
 */

import type { ActionName } from './types';

type ActionInfo = {
  description: string;
  hook: string;
};

/**
 * Action definitions for documentation and validation.
 */
export const ACTION_INFO: Record<ActionName, ActionInfo> = {
  enableSOSAPI: {
    description: 'Enable Smart Object Storage API for Veeam',
    hook: 'useEnableSOSAPIMutation',
  },
  createAccount: {
    description: 'Create a new account',
    hook: 'useCreateAccountMutation',
  },
  refetchConfig: {
    description: 'Refresh accounts/locations/endpoints configuration',
    hook: 'useRefetchConfig',
  },
  assumeRole: {
    description: 'Assume the account role to get S3 client',
    hook: 'useAssumeRole',
  },
  createBucket: {
    description: 'Create an S3 bucket',
    hook: 'useCreateBucketByS3Client',
  },
  tagBucket: {
    description: 'Set bucket tags',
    hook: 'usePutBucketTaggingMutationByS3Client',
  },
  putObject: {
    description: 'Upload an object to a bucket',
    hook: 'usePutObjectMutation',
  },
  createIAMUser: {
    description: 'Create an IAM user',
    hook: 'useCreateIAMUserMutation',
  },
  createAccessKey: {
    description: 'Generate access key for an IAM user',
    hook: 'useCreateUserAccessKeyMutation',
  },
  createPolicy: {
    description: 'Create or update an IAM policy',
    hook: 'useCreateOrAddBucketToPolicyMutation',
  },
  attachPolicy: {
    description: 'Attach a policy to an IAM user',
    hook: 'useAttachPolicyToUserMutation',
  },
};

/**
 * Get the description for an action.
 */
export function getActionDescription(action: ActionName): string {
  return ACTION_INFO[action].description;
}

/**
 * Validate that an action name is valid.
 */
export function isValidAction(action: string): action is ActionName {
  return action in ACTION_INFO;
}
