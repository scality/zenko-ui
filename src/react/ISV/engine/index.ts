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

// Mutation builders (for custom mutation orchestration)
export {
  buildAccountMutations,
  buildBucketLoopMutation,
  buildIAMMutations,
  buildSOSAPIMutation,
  expandLoopMutation,
  isLoopMutation,
  STANDARD_BUCKET_STEPS,
} from './builders';
// Main API
export { definePlatform } from './definePlatform';
// Types
export type {
  BucketItem,
  DefaultSectionId,
  DisabledMessageComponent,
  // Disabled message
  DisabledMessageProps,
  // Field definitions
  FieldDef,
  FieldOverrideConfig,
  // Form data
  FormData,
  // Context
  FullContext,
  // Platform identity
  ISVId,
  // Template (output)
  ISVPlatform,
  LoopMutationDef,
  // Mutation types (for custom orchestration)
  MutationDef,
  PerBucketStep,
  // Platform config (input)
  PlatformConfig,
  PreviousResults,
  SectionDef,
  SectionRenderProps,
  SingleMutationDef,
  SOSAPIStatus,
  SummaryConfig,
  SummaryRenderProps,
} from './types';
// Validators (for custom validators)
export {
  accountValidator,
  bucketsValidator,
  bucketsWithCapacityValidator,
  CommvaultValidator,
  iamValidator,
  immutableValidator,
  KastenValidator,
  VeeamVBOValidator,
  VeeamVBRValidator,
} from './validators';
