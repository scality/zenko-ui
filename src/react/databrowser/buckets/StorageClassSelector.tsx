import { Loader } from '@scality/core-ui';
import { Select } from '@scality/core-ui/dist/next';
import type { StorageClassSelectorProps } from '@scality/data-browser-library';
import type { LocationInfo } from '../../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import { useLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useLocationsEndpointsAdapter } from '../../next-architecture/ui/LocationsEndpointsAdapterProvider';
import { getLocationTypeShort, isCRRLocation, isHdclientV2, isReplicationTarget } from '../../utils/storageOptions';

const locationFilter: Record<string, (l: LocationInfo) => boolean> = {
  replication: isReplicationTarget,
  // CRR locations are replication-only targets: transitions towards them are
  // rejected by the backend, so they must not be offered for lifecycle rules.
  lifecycle: (l) => !isHdclientV2(l) && !isCRRLocation(l),
};

export function StorageClassSelector({ value, onChange, context }: StorageClassSelectorProps) {
  const adapter = useLocationsEndpointsAdapter();
  const { locationsAndEndpoints, status } = useLocationsAndEndpoints({
    locationsEndpointsAdapter: adapter,
  });

  if (status === 'loading') {
    return <Loader size="small" />;
  }

  const allLocations = locationsAndEndpoints?.locations ?? [];
  const locations = allLocations.filter(locationFilter[context]);

  return (
    <Select id="storageClass" value={value} onChange={onChange} placeholder="Select a location...">
      {locations.map((location) => {
        const typeName = getLocationTypeShort(location);
        return (
          <Select.Option key={location.name} value={location.name}>
            {`${location.name} (${typeName})`}
          </Select.Option>
        );
      })}
    </Select>
  );
}
