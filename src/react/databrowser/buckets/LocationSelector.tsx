import { Loader } from '@scality/core-ui';
import { Select } from '@scality/core-ui/dist/next';
import type { LocationSelectorProps } from '@scality/data-browser-library';
import { useEffect } from 'react';
import { useLocationsAndEndpoints } from '../../next-architecture/domain/business/accounts';
import { useLocationsEndpointsAdapter } from '../../next-architecture/ui/LocationsEndpointsAdapterProvider';
import { getLocationTypeShort } from '../../utils/storageOptions';

const DEFAULT_LOCATION = 'us-east-1';

export function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const adapter = useLocationsEndpointsAdapter();
  const { locationsAndEndpoints, status } = useLocationsAndEndpoints({
    locationsEndpointsAdapter: adapter,
  });

  const locations = locationsAndEndpoints?.locations ?? [];

  useEffect(() => {
    if (status === 'success' && !value) {
      onChange(DEFAULT_LOCATION);
    }
  }, [status, value, onChange]);

  if (status === 'loading') {
    return <Loader size="small" />;
  }

  return (
    <Select id="locationConstraint" value={value} onChange={onChange} placeholder="Select a location...">
      {locations.map((location) => {
        const typeName = getLocationTypeShort(location);
        const isCold = !!location.isCold;
        return (
          <Select.Option
            key={location.name}
            value={location.name}
            disabled={isCold}
            disabledReason={isCold ? "Cold Location can't be used" : undefined}
          >
            {`${location.name} (${typeName})`}
          </Select.Option>
        );
      })}
    </Select>
  );
}
