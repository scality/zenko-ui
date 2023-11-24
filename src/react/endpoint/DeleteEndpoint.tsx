import { useMemo, useState } from 'react';
import DeleteConfirmation from '../ui-elements/DeleteConfirmation';
import * as T from '../ui-elements/Table';
import { Icon } from '@scality/core-ui';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useMutation } from 'react-query';
import { useManagementClient } from '../ManagementProvider';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useInstanceId } from '../next-architecture/ui/AuthProvider';
import { useWaitForRunningConfigurationVersionToBeUpdated } from '../../js/mutations';

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
  const { refetchAccountsLocationsEndpoints } =
    useAccountsLocationsAndEndpoints({
      accountsLocationsEndpointsAdapter,
    });
  const instanceId = useInstanceId();
  const managementClient = useManagementClient();
  const deleteEndpointMutation = useMutation({
    mutationFn: () => {
      return notFalsyTypeGuard(
        managementClient,
      ).deleteConfigurationOverlayEndpoint(hostname, instanceId);
    },
  });
  const {
    setReferenceVersion,
    waitForRunningConfigurationVersionToBeUpdated,
    status: waiterStatus,
  } = useWaitForRunningConfigurationVersionToBeUpdated();
  const refetchMutation = useMutation({
    mutationFn: () => {
      return refetchAccountsLocationsEndpoints().then(({ data }) => data);
    },
  });
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
      refetchMutation.mutate(undefined);
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
