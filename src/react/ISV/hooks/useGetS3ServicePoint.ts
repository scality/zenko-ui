import { useMemo } from 'react';
import { useLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useLocationsEndpointsAdapter } from '../../next-architecture/ui/LocationsEndpointsAdapterProvider';

export const useGetS3ServicePoint = () => {
  const locationsEndpointsAdapter = useLocationsEndpointsAdapter();

  const { locationsAndEndpoints, status } = useLocationsAndEndpoints({
    locationsEndpointsAdapter,
  });
  const s3ServicePoint = useMemo(
    () => locationsAndEndpoints?.endpoints?.find((endpoint) => !endpoint.isBuiltin)?.hostname || '',
    [locationsAndEndpoints, status],
  );

  return { s3ServicePoint };
};
