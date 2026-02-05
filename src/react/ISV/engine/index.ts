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
  SummaryRenderProps,

  // Field definitions
  FieldDef,

  // Form data
  FormData,
  BucketItem,

  // Context
  FullContext,
  SOSAPIStatus,
  PreviousResults,

  // Mutation types (for custom orchestration)
  MutationDef,
  SingleMutationDef,
  LoopMutationDef,

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
  KastenValidator,
  VeeamVBRValidator,
  VeeamVBOValidator,
} from './validators';

// Mutation builders (for custom mutation orchestration)
export {
  buildSOSAPIMutation,
  buildAccountMutations,
  buildBucketLoopMutation,
  buildIAMMutations,
  STANDARD_BUCKET_STEPS,
  isLoopMutation,
  expandLoopMutation,
} from './builders';
