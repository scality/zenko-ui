import { Icon } from '@scality/core-ui';
import { useMemo, useState } from 'react';
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
import { ArtescaLibraryNotAvailable } from '../next-architecture/ui/ArtescaLibraryProvider';
import { useArtescaLibrary } from '../next-architecture/ui/ArtescaLibraryProvider';

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

  const artescaLibrary = useArtescaLibrary();
  const {
    useArtescaPlusVeeamDefaultOrOpenMode,
    ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME,
  } =
    artescaLibrary instanceof ArtescaLibraryNotAvailable
      ? {
          useArtescaPlusVeeamDefaultOrOpenMode: undefined,
          ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME: undefined,
        }
      : artescaLibrary;
  const {
    artescaPlusVeeamDefaultOrOpenMode,
    artescaPlusVeeamDefaultOrOpenModeStatus,
  } = useArtescaPlusVeeamDefaultOrOpenMode();
  const isDisabledForArtescaPlusVeeam =
    artescaPlusVeeamDefaultOrOpenMode === 'default' &&
    hostname === ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME;
  const isDisabledForOpenMode = artescaPlusVeeamDefaultOrOpenMode === 'open';
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
  const tooltipMessage = isBuiltin
    ? 'This Data Service can not be deleted'
    : isDisabledForArtescaPlusVeeam
    ? 'This is the Data Service created for Artesca + Veeam and it should not be deleted'
    : isDisabledForOpenMode
    ? 'The deletion of Data Services has been disabled for Open Mode'
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
        disabled={
          isBuiltin || isDisabledForArtescaPlusVeeam || isDisabledForOpenMode
        }
        isLoading={artescaPlusVeeamDefaultOrOpenModeStatus === 'loading'}
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
