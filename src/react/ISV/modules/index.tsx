import Joi from '@hapi/joi';
import styled from 'styled-components';
import { accountNameValidationSchema } from '../../account/AccountCreate';
import { bucketNameValidationSchema } from '../utils/bucketNameValidation';
import { Commvault } from './commvault';
import { ISVPlatformConfig } from '../types';
import { VeeamVBO } from './veeam-vbo';
import { Veeam } from './veeam';
import { Stack } from '@scality/core-ui';

export const ListItem = styled.li`
  padding: 0.5rem;
`;

export const checkDecimals = (value: number, helpers: Joi.CustomHelpers) => {
  const stringValue = value.toString();
  if (stringValue.includes('.')) {
    const decimals = stringValue.split('.')[1];
    if (decimals.length > 2) {
      return helpers.message({
        custom: '"capacity" must have at most 2 decimals',
      });
    }
  }
  return value;
};

export const isvModules: () => ISVPlatformConfig[] = () => [
  Veeam,
  Commvault,
  VeeamVBO,
];

export const commonValidator = {
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
  buckets: Joi.array().items(
    Joi.object({
      name: bucketNameValidationSchema,
      tag: Joi.string(),
      capacity: Joi.valid(),
      capacityUnit: Joi.valid(),
    }),
  ),
};

export const IAMUSerTooltip = ({ platform }: { platform: string }) => {
  return (
    <Stack direction="vertical" gap="r8">
      <>
        {`${platform} requires an IAM User with access keys (AK/SK) to use a bucket
        as a backup target within the Object Storage context. The user will have
        IAM policies granting the necessary ${platform} permissions on the
        bucket(s).`}
      </>

      <ul>
        <ListItem>
          {`If a IAM User created via the ${platform} assistant already exists, it
          is recommended to use it (${platform} should recognize and use its
          existing AK/SK).`}
        </ListItem>
        <ListItem>
          {`If a IAM User created via the ${platform} assistant already exists, it
          is recommended to use it (${platform} should recognize and use its
          existing AK/SK).`}
        </ListItem>
        <ListItem>
          {`If no IAM User is available in the account (or if it's a new account),
          a new user will be created automatically, and its AK/SK will be
          provided at the summary step. If needed (like key loss or rotation), a
          new set of AK/SK can be generated for an existing user.`}
        </ListItem>
      </ul>
    </Stack>
  );
};
