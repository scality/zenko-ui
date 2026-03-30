import type { ISVPlatform } from '../engine/types';
import { CommvaultPlatform } from './commvault';
import { KastenPlatform } from './kasten';
import { RubrikPlatform } from './rubrik';
import { VeeamVBOPlatform } from './veeam-vbo';
import { VeeamVBRPlatform } from './veeam-vbr';

/**
 * Registry of all available ISV platforms.
 */
export const platformRegistry: ISVPlatform[] = [VeeamVBRPlatform, VeeamVBOPlatform, CommvaultPlatform, KastenPlatform, RubrikPlatform];

/**
 * Find a platform by its ID.
 */
export const getPlatformById = (id: string): ISVPlatform | undefined => platformRegistry.find((p) => p.id === id);
