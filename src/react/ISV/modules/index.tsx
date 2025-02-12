import { Veeam } from './veeam';
import { ISVPlatformConfig } from '../types';
import styled from 'styled-components';
import Joi from '@hapi/joi';
import { Commvault } from './commvault';
import { VeeamVBO } from './veeam-vbo';
import { accountNameValidationSchema } from '../../account/AccountCreate';
import { bucketNameValidationSchema } from '../../databrowser/buckets/BucketCreate';

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

export const isvModules: ISVPlatformConfig[] = [Veeam, Commvault, VeeamVBO];

export type { ISVPlatformConfig };
