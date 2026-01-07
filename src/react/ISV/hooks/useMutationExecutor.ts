/**
 * Mutation Executor Hook
 *
 * Converts template mutations (MutationDef[]) into the format expected
 * by useChainedMutations (MutationConfig[] + VariablesResolvers).
 */

import { useMemo } from 'react';
import { useMutation } from 'react-query';
import { MutationConfig, VariablesResolvers } from '@scality/react-chained-query';
import {
  useAttachPolicyToUserMutation,
  useCreateAccountMutation,
  useCreateIAMUserMutation,
  useCreateUserAccessKeyMutation,
  useCreateOrAddBucketToPolicyMutation,
  useEnableSOSAPIMutation,
  usePutBucketTaggingMutationByS3Client,
  usePutObjectMutation,
} from '../../../js/mutations';
import { useCreateBucketByS3Client } from '../../next-architecture/domain/business/buckets';
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
import { isLoopMutation, expandLoopMutation } from '../engine/builders/buildMutations';

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
  template: ISVPlatform;
  formData: FormData;
  context: FullContext;
};

type UseMutationExecutorResult = {
  mutations: MutationConfig[];
  variables: VariablesResolvers;
};

/**
 * useMutationExecutor converts template mutations into the format
 * expected by useChainedMutations.
 *
 * This hook:
 * 1. Expands loop mutations (bucket iterations) into individual steps
 * 2. Filters out mutations based on their `when` conditions
 * 3. Maps each action to its corresponding mutation hook
 * 4. Generates variable resolvers for each mutation
 */
export function useMutationExecutor({
  template,
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

  // Action to mutation/hook mapping
  // Using Partial<MutationConfig> to allow either mutation or hook property
  const actionMutationMap: Record<
    ActionName,
    Omit<MutationConfig, 'id' | 'label'>
  > = useMemo(
    () => ({
      enableSOSAPI: { mutation: enableSOSAPIMutation },
      createAccount: { mutation: createAccountMutation },
      refetchConfig: { mutation: refetchConfigMutation },
      assumeRole: { mutation: assumeRoleMutation },
      createBucket: { hook: useCreateBucketByS3Client },
      tagBucket: { hook: usePutBucketTaggingMutationByS3Client },
      putObject: { hook: usePutObjectMutation },
      createIAMUser: { mutation: createIAMUserMutation },
      createAccessKey: { mutation: createUserAccessKeyMutation },
      createPolicy: { mutation: createPolicyMutation },
      attachPolicy: { mutation: attachPolicyToUserMutation },
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

    for (const mutation of template.mutations) {
      if (isLoopMutation(mutation)) {
        // Expand loop mutation into individual steps
        const expanded = expandLoopMutation(mutation, formData, context);
        result.push(...expanded);
      } else {
        result.push(mutation);
      }
    }

    return result;
  }, [template.mutations, formData, context]);

  // Filter mutations based on `when` conditions and build MutationConfig[]
  const { mutations, variables } = useMemo(() => {
    const mutationConfigs: MutationConfig[] = [];
    const variableResolvers: VariablesResolvers = {};

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

      // Build MutationConfig - spread the action config (mutation or hook)
      mutationConfigs.push({
        id: def.id,
        label: def.label,
        ...actionConfig,
      } as MutationConfig);

      // Build variable resolver
      variableResolvers[def.id] = (prev: PreviousResults) =>
        def.variables(formData, prev, context);
    }

    return { mutations: mutationConfigs, variables: variableResolvers };
  }, [expandedMutations, formData, context, actionMutationMap]);

  return { mutations, variables };
}

/**
 * Build the full runtime context from form data and runtime information
 */
export function buildRuntimeContext(params: {
  template: ISVPlatform;
  account: { id: string; name: string; roleArn: string } | null;
  IAMUserNameType?: 'create' | 'existing';
  generateKey?: boolean;
  sosApiStatus: SOSAPIStatus;
  instanceId: string;
}): FullContext {
  const { template, account, IAMUserNameType, generateKey, sosApiStatus, instanceId } =
    params;

  const isNewAccount = !account;
  const needsIAMUser = isNewAccount || IAMUserNameType === 'create';
  const needsAccessKey = needsIAMUser || (IAMUserNameType === 'existing' && !!generateKey);

  return {
    _sosApiStatus: sosApiStatus,
    _existingAccount: account
      ? {
          id: account.id,
          name: account.name,
          roleArn: account.roleArn,
        }
      : null,
    _platformId: template.id,
    _bucketTag: template.bucketTag,
    _instanceId: instanceId,
    isNewAccount,
    needsIAMUser,
    needsAccessKey,
  };
}

