import { useMutation, useQueryClient } from 'react-query';

/**
 * Reloads the lists a run writes to, so the Accounts and Locations pages are right
 * when the user goes back to them. They are cached with refetchOnMount: false and
 * are unmounted while the wizard runs, so marking them stale would not be enough.
 */
export const useRefreshConfigurationMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      Promise.all([
        // Without throwOnError react-query v3 swallows the failure, and the row would
        // report Success while the lists stayed stale.
        queryClient.refetchQueries(['WebIdentityRoles'], undefined, { throwOnError: true }),
        queryClient.refetchQueries(['locationsEndpoints'], undefined, { throwOnError: true }),
      ]),
  });
};
