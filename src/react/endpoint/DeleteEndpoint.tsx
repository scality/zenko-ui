import { Icon } from '@scality/core-ui';
import { useMemo, useState } from 'react';
import { useMutation } from 'react-query';
import { useWaitForRunningConfigurationVersionToBeUpdated } from '../../js/mutations';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useManagementClient } from '../ManagementProvider';
import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useAuth, useInstanceId } from '../next-architecture/ui/AuthProvider';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import * as T from '../ui-elements/Table';

export const DeleteEndpoint = ({
  hostname,
  isBuiltin,
}: {
  hostname: string;
  isBuiltin: boolean;
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
  useMemo(() => {
    if (waiterStatus === 'success') {
      setIsConfirmDeleteOpen(false);
      refetchAccountsLocationsEndpointsMutation.mutate(undefined);
    }
  }, [waiterStatus]);
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
        disabled={isBuiltin}
        icon={<Icon name="Delete" />}
        tooltip={{
          overlay: 'Delete Data Service',
          placement: 'top',
        }}
        onClick={() => setIsConfirmDeleteOpen(true)}
        variant="danger"
      />
    </>
  );
};
