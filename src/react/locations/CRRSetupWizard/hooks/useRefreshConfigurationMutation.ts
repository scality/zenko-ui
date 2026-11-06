import { useMutation, useQueryClient } from 'react-query';
import { useLocationsAndEndpoints } from '../../../next-architecture/domain/business/accounts';
import { useLocationsEndpointsAdapter } from '../../../next-architecture/ui/LocationsEndpointsAdapterProvider';

/**
 * What the ISV assistant does once its run is over: refetch the locations (its refetchConfig
 * step) and invalidate the accounts (its Continue/Exit). Gathered in one step here because
 * this wizard moves on by itself when the run succeeds, without a Continue click.
 */
export const useRefreshConfigurationMutation = () => {
  const queryClient = useQueryClient();
  const locationsEndpointsAdapter = useLocationsEndpointsAdapter();
  const { refetchLocationsEndpointsMutation } = useLocationsAndEndpoints({ locationsEndpointsAdapter });

  return useMutation({
    mutationFn: () => {
      queryClient.invalidateQueries(['WebIdentityRoles']);
      return refetchLocationsEndpointsMutation.mutateAsync();
    },
  });
};
