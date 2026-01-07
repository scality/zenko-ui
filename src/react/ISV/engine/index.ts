/**
 * ISV Template Engine
 *
 * This module provides the `definePlatform` API for creating ISV platform templates.
 *
 * @example
 * ```typescript
 * import { definePlatform } from './engine';
 *
 * const MyPlatform = definePlatform({
 *   id: 'my-platform',
 *   name: 'My Platform',
 *   logo: <MyLogo />,
 *   policy: GET_MY_POLICY,
 * });
 * ```
 *
 * @module engine
 */

// Main API
export { definePlatform } from './definePlatform';

// Types
export type {
  // Platform identity
  ISVId,

  // Platform config (input)
  PlatformConfig,
  FieldOverrideConfig,
  PerBucketStep,

  // Template (output)
  ISVPlatform,
  SummaryConfig,

  // Field definitions
  FieldDef,

  // Form data
  FormData,
  BucketItem,

  // Context
  FullContext,
  SOSAPIStatus,
  PreviousResults,

  // Disabled message
  DisabledMessageProps,
  DisabledMessageComponent,
} from './types';

// Validators (for custom validators)
export {
  accountValidator,
  iamValidator,
  bucketsValidator,
  bucketsWithCapacityValidator,
  immutableValidator,
  CommvaultValidator,
  VeeamVBRValidator,
  VeeamVBOValidator,
} from './validators';
