import { useMemo } from 'react';
import { useAccountsLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { useArtescaPlusVeeamMode } from './hooks';
import { Endpoint } from '../../types/config';

// Helper function to check if endpoint deletion should be disabled
const isEndpointDeletionDisabled = (
  endpoint: Endpoint,
  ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME: string | undefined,
  isDisabledForOpenMode: boolean,
): boolean => {
  return (
    endpoint.hostname === ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME ||
    isDisabledForOpenMode ||
    Boolean(endpoint.isBuiltin)
  );
};

/**
 * Hook that returns a map of endpoints where deletion is disabled
 * @returns {Object} Object containing:
 *   - endpointsDeletionDisabledMap: Record<hostname, isDisabled>
 *   - status: Current loading state ('idle' | 'loading' | 'error' | 'success')
 */
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

  const {
    artescaPlusVeeamDefaultOrOpenMode,
    artescaPlusVeeamDefaultOrOpenModeStatus,
    ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME,
  } = useArtescaPlusVeeamMode();

  // Calculate if deletion is disabled for open mode
  const isDisabledForOpenMode = useMemo(() => {
    if (
      accountsLocationsEndpointsStatus !== 'success' ||
      !accountsLocationsAndEndpoints.endpoints
    ) {
      return false;
    }

    // Disable endpoint deletion when there is only one non-Veeam, non-builtin endpoint remaining
    // to avoid going back to default mode
    const nonVeeamNonBuiltinCount =
      accountsLocationsAndEndpoints.endpoints.filter(
        (endpoint) =>
          endpoint.hostname !== ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME &&
          endpoint.isBuiltin === false,
      ).length;

    return (
      artescaPlusVeeamDefaultOrOpenMode === 'open' &&
      nonVeeamNonBuiltinCount === 1
    );
  }, [
    accountsLocationsEndpointsStatus,
    accountsLocationsAndEndpoints.endpoints,
    artescaPlusVeeamDefaultOrOpenMode,
    ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME,
  ]);

  const endpointsDeletionDisabledMap = useMemo(() => {
    // Early return for non-success states
    if (
      accountsLocationsEndpointsStatus !== 'success' ||
      !accountsLocationsAndEndpoints.endpoints
    ) {
      return {};
    }

    const record: Record<string, boolean> = {};

    accountsLocationsAndEndpoints.endpoints.forEach((endpoint) => {
      record[endpoint.hostname] = isEndpointDeletionDisabled(
        endpoint,
        ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME,
        isDisabledForOpenMode,
      );
    });

    return record;
  }, [
    accountsLocationsAndEndpoints.endpoints,
    ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME,
    isDisabledForOpenMode,
    accountsLocationsEndpointsStatus,
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
