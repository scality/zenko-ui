import { Veeam } from './veeam';
import { ISVPlatformConfig } from '../types';
import styled from 'styled-components';
import Joi from '@hapi/joi';
import { Commvault } from './commvault';
import { VeeamVBO } from './veeam-vbo';

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

export const isvModules: ISVPlatformConfig[] = [Veeam, Commvault, VeeamVBO];

export type { ISVPlatformConfig };
