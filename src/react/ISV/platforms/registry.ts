import { ISVPlatform } from '../engine/types';
import { CommvaultPlatform } from './commvault';
import { VeeamVBRPlatform } from './veeam-vbr';
import { VeeamVBOPlatform } from './veeam-vbo';

/**
 * Registry of all available ISV platforms.
 */
export const platformRegistry: ISVPlatform[] = [
  VeeamVBRPlatform,
  VeeamVBOPlatform,
  CommvaultPlatform,
];

/**
 * Find a platform by its ID.
 */
export const getPlatformById = (id: string): ISVPlatform | undefined =>
  platformRegistry.find((p) => p.id === id);

