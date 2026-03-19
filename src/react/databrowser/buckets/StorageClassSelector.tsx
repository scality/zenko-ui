import { Loader } from '@scality/core-ui';
import { Select } from '@scality/core-ui/dist/next';
import type { StorageClassSelectorProps } from '@scality/data-browser-library';
import type { LocationInfo } from '../../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import { useAccountsLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useAccountsLocationsEndpointsAdapter } from '../../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { getLocationTypeShort, isHdclientV2, isReplicationTarget } from '../../utils/storageOptions';

const locationFilter: Record<string, (l: LocationInfo) => boolean> = {
  replication: isReplicationTarget,
  lifecycle: (l) => !isHdclientV2(l),
};

export function StorageClassSelector({ value, onChange, context }: StorageClassSelectorProps) {
  const adapter = useAccountsLocationsEndpointsAdapter();
  const { accountsLocationsAndEndpoints, status } = useAccountsLocationsAndEndpoints({
    accountsLocationsEndpointsAdapter: adapter,
  });

  if (status === 'loading') {
    return <Loader size="small" />;
  }

  const allLocations = accountsLocationsAndEndpoints?.locations ?? [];
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
