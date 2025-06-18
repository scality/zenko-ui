import { Icon } from '@scality/core-ui';
import { useEffect, useState } from 'react';
import { useMutation } from 'react-query';
import { useWaitForRunningConfigurationVersionToBeUpdated } from '../../js/mutations';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useManagementClient } from '../ManagementProvider';
import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useInstanceId } from '../next-architecture/ui/AuthProvider';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import * as T from '../ui-elements/Table';
import { useShellHooks } from '@scality/module-federation';

export const DeleteEndpoint = ({
  hostname,
  endpointsDeletionDisabledMap,
  endpointsDeletionDisabledStatus,
}: {
  hostname: string;
  endpointsDeletionDisabledMap: Record<string, boolean>;
  endpointsDeletionDisabledStatus: 'idle' | 'loading' | 'error' | 'success';
}) => {
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const { refetchAccountsLocationsEndpointsMutation } =
    useAccountsLocationsAndEndpoints({
      accountsLocationsEndpointsAdapter,
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
          },
        });
      },
    });
  };

  useEffect(() => {
    if (waiterStatus === 'success') {
      setIsConfirmDeleteOpen(false);
      refetchAccountsLocationsEndpointsMutation.mutate(undefined);
    }
  }, [waiterStatus, refetchAccountsLocationsEndpointsMutation]);

  const tooltipMessage = endpointsDeletionDisabledMap[hostname]
    ? 'This Data Service can not be deleted'
    : 'Delete Data Service';

  return (
    <>
      <DeleteConfirmation
        show={isConfirmDeleteOpen}
        cancel={() => setIsConfirmDeleteOpen(false)}
        approve={handleDeleteApprove}
        isLoading={
          deleteEndpointMutation.isLoading || waiterStatus === 'waiting'
        }
        titleText={`Are you sure you want to delete Data Service: ${hostname} ?`}
      />
      <T.ActionButton
        disabled={endpointsDeletionDisabledMap[hostname]}
        isLoading={endpointsDeletionDisabledStatus === 'loading'}
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
