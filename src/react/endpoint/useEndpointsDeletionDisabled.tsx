import { useMemo } from 'react';
import type { Endpoint } from '../../types/config';
import { useLocationsAndEndpoints } from '../next-architecture/domain/business/accounts';
import { useLocationsEndpointsAdapter } from '../next-architecture/ui/LocationsEndpointsAdapterProvider';
import { useArtescaPlusVeeamMode } from './hooks';

// Helper function to check if endpoint deletion should be disabled
const isEndpointDeletionDisabled = (
  endpoint: Endpoint,
  ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME: string | undefined,
  isDisabledForOpenMode: boolean,
): boolean => {
  return (
    endpoint.hostname === ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME || isDisabledForOpenMode || Boolean(endpoint.isBuiltin)
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
  const locationsEndpointsAdapter = useLocationsEndpointsAdapter();
  const { locationsAndEndpoints, status: locationsEndpointsStatus } = useLocationsAndEndpoints({
    locationsEndpointsAdapter,
  });

  const {
    artescaPlusVeeamDefaultOrOpenMode,
    artescaPlusVeeamDefaultOrOpenModeStatus,
    ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME,
  } = useArtescaPlusVeeamMode();

  // Calculate if deletion is disabled for open mode
  const isDisabledForOpenMode = useMemo(() => {
    if (locationsEndpointsStatus !== 'success' || !locationsAndEndpoints.endpoints) {
      return false;
    }

    // Disable endpoint deletion when there is only one non-Veeam, non-builtin endpoint remaining
    // to avoid going back to default mode
    const nonVeeamNonBuiltinCount = locationsAndEndpoints.endpoints.filter(
      (endpoint) => endpoint.hostname !== ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME && endpoint.isBuiltin === false,
    ).length;

    return artescaPlusVeeamDefaultOrOpenMode === 'open' && nonVeeamNonBuiltinCount === 1;
  }, [
    locationsEndpointsStatus,
    locationsAndEndpoints.endpoints,
    artescaPlusVeeamDefaultOrOpenMode,
    ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME,
  ]);

  const endpointsDeletionDisabledMap = useMemo(() => {
    // Early return for non-success states
    if (locationsEndpointsStatus !== 'success' || !locationsAndEndpoints.endpoints) {
      return {};
    }

    const record: Record<string, boolean> = {};

    locationsAndEndpoints.endpoints.forEach((endpoint) => {
      record[endpoint.hostname] = isEndpointDeletionDisabled(
        endpoint,
        ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME,
        isDisabledForOpenMode,
      );
    });

    return record;
  }, [
    locationsAndEndpoints.endpoints,
    ARTESCA_PLUS_VEEAM_S3_ENDPOINT_NAME,
    isDisabledForOpenMode,
    locationsEndpointsStatus,
  ]);

  const status =
    artescaPlusVeeamDefaultOrOpenModeStatus === 'loading' || locationsEndpointsStatus === 'loading'
      ? 'loading'
      : artescaPlusVeeamDefaultOrOpenModeStatus === 'error' || locationsEndpointsStatus === 'error'
        ? 'error'
        : locationsEndpointsStatus === 'success' && artescaPlusVeeamDefaultOrOpenModeStatus === 'success'
          ? 'success'
          : 'idle';

  return { endpointsDeletionDisabledMap, status };
};

export default useEndpointsDeletionDisabled;
