/**
 * Define Platform
 *
 * Main entry point for creating ISV platform templates.
 * This is the primary API that platform developers will use.
 */

import Joi from 'joi';
import { buildFields } from './builders/buildFields';
import { buildMutations } from './builders/buildMutations';
import type { ISVPlatform, PlatformConfig, SummaryConfig } from './types';
import { accountValidator, getBucketsValidator, iamValidator, immutableValidator } from './validators';

/**
 * Build a validator from platform configuration
 */
function buildValidator(config: PlatformConfig): Joi.ObjectSchema {
  const baseSchema = {
    ...accountValidator,
    ...iamValidator,
    ...getBucketsValidator(config.bucketCapacity ?? false),
    ...immutableValidator,
  };

  return Joi.object(baseSchema);
}

/**
 * Build summary configuration from platform config
 */
function buildSummary(config: PlatformConfig): SummaryConfig {
  return {
    title: config.summary?.title ?? `${config.name} preparation summary`,
    serviceEndpointLabel: config.summary?.serviceEndpointLabel ?? 'Service Endpoint',
    bucketBanner: config.summary?.bucketBanner,
    immutabilityLabel: config.summary?.immutabilityLabel ?? 'Immutable Backup',
    immutabilityHelpText: config.summary?.immutabilityHelpText,
    accessKeyLabel: config.summary?.accessKeyLabel ?? 'Access key ID',
    secretKeyLabel: config.summary?.secretKeyLabel ?? 'Secret Access key',
    customRender: config.summary?.customRender,
    sections: config.summary?.sections,
  };
}

/**
 * Define an ISV platform configuration
 *
 * This is the main API for creating platform configurations.
 * It generates fields, validators, and mutations based on the config.
 *
 * @example
 * ```typescript
 * const Commvault = definePlatform({
 *   id: 'commvault',
 *   name: 'Commvault',
 *   logo: <CommvaultLogo />,
 *   policy: GET_COMMVAULT_POLICY,
 *
 *   fieldOverrides: {
 *     enableImmutableBackup: { label: 'WORM Storage lock' },
 *   },
 *
 *   summary: {
 *     serviceEndpointLabel: 'Service Host',
 *   },
 * });
 * ```
 *
 * @example
 * ```typescript
 * const VeeamVBR = definePlatform({
 *   id: 'veeam-vbr',
 *   name: 'Veeam Backup & Replication',
 *   logo: <VeeamLogo />,
 *   policy: GET_VEEAM_POLICY,
 *
 *   sosAPI: true,
 *   bucketCapacity: true,
 *
 *   perBucketSteps: [
 *     {
 *       id: 'veeamSetup',
 *       label: 'Setup repository: {{name}}',
 *       action: 'putObject',
 *       variables: (form, bucket, prev) => ({
 *         Bucket: bucket.name,
 *         Key: 'veeam/system.xml',
 *         Body: SYSTEM_XML_CONTENT,
 *       }),
 *     },
 *   ],
 * });
 * ```
 */
export function definePlatform(config: PlatformConfig): ISVPlatform {
  const fields = buildFields(config);
  const validator = config.customValidator ?? buildValidator(config);
  const mutations = config.mutationOverrides ?? buildMutations(config);

  return {
    id: config.id,
    name: config.name,
    logo: config.logo,
    description: config.description,
    skipModalContent: config.skipModalContent,

    bucketTag: config.bucketTag ?? config.name,

    fields,
    validator,
    mutations,

    summary: buildSummary(config),
    getPolicy: config.policy,

    documentationLink: config.documentationLink,
    assistant: config.assistant ?? true,
    application: config.application,
    disabledMessage: config.disabledMessage,
  };
}
