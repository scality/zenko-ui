import { useMemo } from 'react';
import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import {
  ArtescaLibraryNotAvailable,
  useArtescaLibrary,
} from '../next-architecture/ui/ArtescaLibraryProvider';

// return the list of the endpoint name and a boolean indicating if the endpoint is deletion disabled
const useEndpointsDeletionDisabled = (): {
  endpointsDeletionDisabledMap: Record<string, boolean>;
  status: 'idle' | 'loading' | 'error' | 'success';
} => {
  const accountsLocationsEndpointsAdapter =
    useAccountsLocationsEndpointsAdapter();
  const {
    accountsLocationsAndEndpoints,
    status: accountsLocationsEndpointsStatus,
  } = useAccountsLocationsAndEndpoints({
    accountsLocationsEndpointsAdapter,
  });
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

  // Disable endpoint deletion when there is only one non-Veeam, non-builtin endpoint remaining
  // to avoid going back to default mode
  const isLastNonVeeamEndpoint =
    accountsLocationsEndpointsStatus === 'success' &&
    accountsLocationsAndEndpoints.endpoints.filter(
      (endpoint) =>
        endpoint.hostname !== ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME &&
        endpoint.isBuiltin === false,
    ).length === 1;

  const isDisabledForOpenMode =
    artescaPlusVeeamDefaultOrOpenMode === 'open' && isLastNonVeeamEndpoint;

  const endpointsDeletionDisabledMap = useMemo(() => {
    const record: Record<string, boolean> = {};
    accountsLocationsAndEndpoints.endpoints.forEach((endpoint) => {
      const hostname = endpoint.hostname;
      record[hostname] =
        hostname === ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME ||
        isDisabledForOpenMode ||
        endpoint.isBuiltin;
    });
    return record;
  }, [
    accountsLocationsAndEndpoints.endpoints,
    ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME,
    isDisabledForOpenMode,
  ]);

  const status =
    artescaPlusVeeamDefaultOrOpenModeStatus === 'loading' ||
    accountsLocationsEndpointsStatus === 'loading'
      ? 'loading'
      : artescaPlusVeeamDefaultOrOpenModeStatus === 'error' ||
        accountsLocationsEndpointsStatus === 'error'
      ? 'error'
      : accountsLocationsEndpointsStatus === 'success' &&
        artescaPlusVeeamDefaultOrOpenModeStatus === 'success'
      ? 'success'
      : 'idle';

  return { endpointsDeletionDisabledMap, status };
};

export default useEndpointsDeletionDisabled;
