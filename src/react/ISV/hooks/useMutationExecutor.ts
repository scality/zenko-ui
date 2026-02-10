/**
 * Mutation Executor Hook
 *
 * Converts platform mutations (MutationDef[]) into the format expected
 * by useChainedMutations (MutationConfig[] + VariablesResolvers).
 */

import { useMemo } from 'react';
import { useMutation } from 'react-query';
import {
  VariablesResolvers,
} from '@scality/react-chained-query';
import type {
  MutationConfig,
  StaticMutationConfig,
  DynamicMutationConfig,
} from '@scality/react-chained-query';
import {
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateIAMUserMutation,
  useCreateUserAccessKeyMutation,
  useCreateOrAddBucketToPolicyMutation,
  useEnableSOSAPIMutation,
} from '../../../js/mutations';
import {
  useCreateBucket,
  useSetBucketTagging,
  usePutObject,
} from '@scality/data-browser-library';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useSetAssumedRolePromise } from '../../DataServiceRoleProvider';
import { useInstanceId } from '../../next-architecture/ui/AuthProvider';
import type {
  ISVPlatform,
  FormData,
  FullContext,
  MutationDef,
  SingleMutationDef,
  ActionName,
  PreviousResults,
  SOSAPIStatus,
} from '../engine/types';
import {
  isLoopMutation,
  expandLoopMutation,
} from '../engine/builders/buildMutations';
import { useCreateVeeamRepository } from './useCreateVeeamRepository';

/**
 * Custom hook for refetching accounts/locations/endpoints configuration
 */
const useRefetchConfig = () => {
  const adapter = useAccountsLocationsEndpointsAdapter();
  const { refetchAccountsLocationsEndpointsMutation } =
    useAccountsLocationsAndEndpoints({
      accountsLocationsEndpointsAdapter: adapter,
    });
  return refetchAccountsLocationsEndpointsMutation;
};

/**
 * Custom hook for assuming an account role
 */
const useAssumeRole = () => {
  const setRolePromise = useSetAssumedRolePromise();
  return useMutation({
    mutationFn: async ({ roleArn }: { roleArn: string }) => {
      const s3Config = await setRolePromise({ roleArn });
      return s3Config;
    },
  });
};

type UseMutationExecutorOptions = {
  platform: ISVPlatform;
  formData: FormData;
  context: FullContext;
};

type UseMutationExecutorResult = {
  mutations: MutationConfig[];
  variables: VariablesResolvers;
  failureMessages: Record<string, string>;
};

/**
 * useMutationExecutor converts platform mutations into the format
 * expected by useChainedMutations.
 *
 * This hook:
 * 1. Expands loop mutations (bucket iterations) into individual steps
 * 2. Filters out mutations based on their `when` conditions
 * 3. Maps each action to its corresponding mutation hook
 * 4. Generates variable resolvers for each mutation
 */
export function useMutationExecutor({
  platform,
  formData,
  context,
}: UseMutationExecutorOptions): UseMutationExecutorResult {
  // Get instanceId for createAccount mutation
  const instanceId = useInstanceId();

  // Initialize all mutation hooks
  const enableSOSAPIMutation = useEnableSOSAPIMutation();
  const createAccountMutation = useCreateAccountMutation();
  const refetchConfigMutation = useRefetchConfig();
  const assumeRoleMutation = useAssumeRole();
  const createIAMUserMutation = useCreateIAMUserMutation();
  const createUserAccessKeyMutation = useCreateUserAccessKeyMutation();
  const createPolicyMutation = useCreateOrAddBucketToPolicyMutation();
  const attachPolicyToUserMutation = useAttachPolicyToUserMutation();
  const createVeeamRepositoryMutation = useCreateVeeamRepository();

  // Action to mutation/hook mapping
  type ActionMutationConfig =
    | Omit<StaticMutationConfig, 'id' | 'label'>
    | Omit<DynamicMutationConfig, 'id' | 'label'>;
  const actionMutationMap: Record<ActionName, ActionMutationConfig> = useMemo(
    () => ({
      enableSOSAPI: { mutation: enableSOSAPIMutation },
      createAccount: { mutation: createAccountMutation },
      refetchConfig: { mutation: refetchConfigMutation },
      assumeRole: { mutation: assumeRoleMutation },
      createBucket: { hook: useCreateBucket },
      tagBucket: { hook: useSetBucketTagging },
      putObject: { hook: usePutObject },
      createIAMUser: { mutation: createIAMUserMutation },
      createAccessKey: { mutation: createUserAccessKeyMutation },
      createPolicy: { mutation: createPolicyMutation },
      attachPolicy: { mutation: attachPolicyToUserMutation },
      createVeeamRepository: { mutation: createVeeamRepositoryMutation },
    }),
    [
      enableSOSAPIMutation,
      createAccountMutation,
      refetchConfigMutation,
      assumeRoleMutation,
      createIAMUserMutation,
      createUserAccessKeyMutation,
      createPolicyMutation,
      attachPolicyToUserMutation,
    ],
  );

  // Expand all mutations (including loops)
  const expandedMutations = useMemo((): SingleMutationDef[] => {
    const result: SingleMutationDef[] = [];

    for (const mutation of platform.mutations) {
      if (isLoopMutation(mutation)) {
        // Expand loop mutation into individual steps
        const expanded = expandLoopMutation(mutation, formData, context);
        result.push(...expanded);
      } else {
        result.push(mutation);
      }
    }

    return result;
  }, [platform.mutations, formData, context]);

  // Filter mutations based on `when` conditions and build MutationConfig[]
  const { mutations, variables, failureMessages } = useMemo(() => {
    const mutationConfigs: MutationConfig[] = [];
    const variableResolvers: VariablesResolvers = {};
    const resolvedFailureMessages: Record<string, string> = {};

    for (const def of expandedMutations) {
      // Check `when` condition
      if (def.when && !def.when(formData, context)) {
        continue;
      }

      const actionConfig = actionMutationMap[def.action];
      if (!actionConfig) {
        const errorMsg = `Unknown action: ${def.action}. Check that this action is registered in actionMutationMap.`;
        if (process.env.NODE_ENV === 'development') {
          throw new Error(errorMsg);
        }
        console.error(errorMsg);
        continue;
      }

      // Resolve dynamic label
      const label =
        typeof def.label === 'function'
          ? def.label(formData, context)
          : def.label;

      // Build MutationConfig - spread the action config (mutation or hook)
      mutationConfigs.push({
        id: def.id,
        label,
        ...actionConfig,
        ...(def.optional && { optional: true }),
      } as MutationConfig);

      // Build variable resolver
      // Cast library's PreviousResults to ISV engine's PreviousResults (structurally compatible)
      variableResolvers[def.id] = (prev) =>
        def.variables(formData, prev as unknown as PreviousResults, context);

      // Resolve failure message for optional steps
      if (def.optional && def.failureMessage) {
        resolvedFailureMessages[def.id] =
          typeof def.failureMessage === 'function'
            ? def.failureMessage(formData, context)
            : def.failureMessage;
      }
    }

    return {
      mutations: mutationConfigs,
      variables: variableResolvers,
      failureMessages: resolvedFailureMessages,
    };
  }, [expandedMutations, formData, context, actionMutationMap]);

  return { mutations, variables, failureMessages };
}

/**
 * Build the full runtime context from form data and runtime information
 */
export function buildRuntimeContext(params: {
  platform: ISVPlatform;
  account: { id: string; name: string; roleArn: string } | null;
  IAMUserNameType?: 'create' | 'existing';
  generateKey?: boolean;
  sosApiStatus: SOSAPIStatus;
  instanceId: string;
  s3ServicePoint?: string;
}): FullContext {
  const {
    platform,
    account,
    IAMUserNameType,
    generateKey,
    sosApiStatus,
    instanceId,
    s3ServicePoint,
  } = params;

  const isNewAccount = !account;
  const needsIAMUser = isNewAccount || IAMUserNameType === 'create';
  const needsAccessKey =
    needsIAMUser || (IAMUserNameType === 'existing' && !!generateKey);

  return {
    _sosApiStatus: sosApiStatus,
    _existingAccount: account
      ? {
          id: account.id,
          name: account.name,
          roleArn: account.roleArn,
        }
      : null,
    _platformId: platform.id,
    _bucketTag: platform.bucketTag,
    _instanceId: instanceId,
    _s3ServicePoint: s3ServicePoint || '',
    isNewAccount,
    needsIAMUser,
    needsAccessKey,
  };
}
