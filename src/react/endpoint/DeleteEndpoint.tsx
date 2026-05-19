import { Icon } from '@scality/core-ui';
import { useShellHooks } from '@scality/module-federation';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { useWaitForRunningConfigurationVersionToBeUpdated } from '../../js/mutations';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useManagementClient } from '../ManagementProvider';
import { useLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useLocationsEndpointsAdapter } from '../next-architecture/ui/LocationsEndpointsAdapterProvider';
import { useInstanceId } from '../next-architecture/ui/AuthProvider';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import * as T from '../ui-elements/Table';

export const DeleteEndpoint = ({ hostname, disabled }: { hostname: string; disabled: boolean }) => {
  const queryClient = useQueryClient();
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const locationsEndpointsAdapter = useLocationsEndpointsAdapter();
  const { refetchLocationsEndpointsMutation } = useLocationsAndEndpoints({
    locationsEndpointsAdapter,
  });
  const instanceId = useInstanceId();
  const managementClient = useManagementClient();
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const deleteEndpointMutation = useMutation({
    mutationFn: async () => {
      const client = notFalsyTypeGuard(managementClient);
      client.setToken(await getToken());
      return client.deleteConfigurationOverlayEndpoint(hostname, instanceId);
    },
  });
  const {
    setReferenceVersion,
    waitForRunningConfigurationVersionToBeUpdated,
    status: waiterStatus,
  } = useWaitForRunningConfigurationVersionToBeUpdated();

  const handleDeleteApprove = () => {
    setReferenceVersion({
      onRefTaken: () => {
        deleteEndpointMutation.mutate(undefined, {
          onSuccess: () => {
            waitForRunningConfigurationVersionToBeUpdated();
            queryClient.invalidateQueries({ queryKey: ['locationsEndpoints'] });
          },
        });
      },
    });
  };

  useEffect(() => {
    if (waiterStatus === 'success') {
      setIsConfirmDeleteOpen(false);
      refetchLocationsEndpointsMutation.mutate(undefined);
    }
  }, [waiterStatus, refetchLocationsEndpointsMutation]);

  const tooltipMessage = disabled ? 'This Data Service can not be deleted' : 'Delete Data Service';

  return (
    <>
      <DeleteConfirmation
        show={isConfirmDeleteOpen}
        cancel={() => setIsConfirmDeleteOpen(false)}
        approve={handleDeleteApprove}
        isLoading={deleteEndpointMutation.isLoading || waiterStatus === 'waiting'}
        titleText={`Are you sure you want to delete Data Service: ${hostname} ?`}
      />
      <T.ActionButton
        disabled={disabled}
        icon={<Icon name="Delete" />}
        tooltip={{
          overlay: tooltipMessage,
          placement: 'top',
        }}
        onClick={() => setIsConfirmDeleteOpen(true)}
        variant="danger"
      />
    </>
  );
};
