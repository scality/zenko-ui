import { ConstrainedText, Icon, Loader, spacing, Text, Wrap } from '@scality/core-ui';
import { Box, Button, CopyButton, Table } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useMemo } from 'react';
import type { Endpoint, Hostname, LocationName } from '../../types/config';
import { renderLocation } from '../locations/utils';
import type { LocationInfo } from '../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import { TOOLTIP_ARTESCA_PLUS_VEEAM_DEFAULT_MODE } from '../next-architecture/ui/ArtescaLibraryProvider';
import { TableHeaderWrapper } from '../ui-elements/Table';
import { AuthorizedAdvancedMetricsButton, cloudServerDashboard } from './AdvancedMetricsButton';
import { DeleteEndpoint } from './DeleteEndpoint';
import { useArtescaPlusVeeamMode } from './hooks';
import useEndpointsDeletionDisabled from './useEndpointsDeletionDisabled';

type CellProps = {
  row: {
    original: Endpoint;
  };
};
type Props = {
  endpoints: Array<Endpoint>;
  locations: LocationInfo[];
};
const SEARCH_QUERY_PARAM = 'search';

function EndpointList({ endpoints, locations }: Props) {
  const navigate = useBasenameRelativeNavigate();

  /*
   *   Enforcing a strict schema because the table interprets `undefined` values
   *   as empty and shows a minus sign instead (which makes total sense), disregarding what is
   *   specified in the custom render (Cell function)
   *   Currently the API returns some objects without a `isBuiltin` property causing this undesired behavior
   */

  const strictSchemaEndpoints = useMemo(
    () =>
      endpoints.map((endpoint) => ({
        ...endpoint,
        isBuiltin: Boolean(endpoint.isBuiltin),
      })),
    [endpoints],
  );

  const { artescaPlusVeeamDefaultOrOpenMode, artescaPlusVeeamDefaultOrOpenModeStatus } = useArtescaPlusVeeamMode();

  const { endpointsDeletionDisabledMap, status: endpointsDeletionDisabledStatus } = useEndpointsDeletionDisabled();

  const columns = useMemo(
    () => [
      {
        Header: 'Hostname',
        accessor: 'hostname',
        cellStyle: {
          flex: '1',
        },
        Cell({ value: hostName }: { value: Hostname }) {
          return (
            <Wrap paddingRight="2rem">
              <ConstrainedText text={<span style={{ paddingRight: spacing.r14 }}>{hostName}</span>} lineClamp={2} />
              <CopyButton textToCopy={hostName} />
            </Wrap>
          );
        },
      },
      {
        Header: 'Location name',
        accessor: 'locationName',
        cellStyle: {
          flex: '2',
        },

        Cell({ value: locationName }: { value: LocationName }) {
          const location = locations.find((location) => location.name === locationName);
          if (!location) {
            return <>unknown</>;
          }
          return <>{renderLocation(location)}</>;
        },
      },
      {
        id: 'action',
        Header: '',
        accessor: 'isBuiltin',
        disableSortBy: true,
        cellStyle: {
          flex: '0.1',
          paddingRight: '18px',
        },
        Cell({ row: { original } }: CellProps) {
          if (endpointsDeletionDisabledStatus === 'success') {
            return (
              <DeleteEndpoint hostname={original.hostname} disabled={endpointsDeletionDisabledMap[original.hostname]} />
            );
          } else if (endpointsDeletionDisabledStatus === 'idle' || endpointsDeletionDisabledStatus === 'loading') {
            return <Loader />;
          } else if (endpointsDeletionDisabledStatus === 'error') {
            return <Text>Error</Text>;
          }
        },
      },
    ],
    [locations, endpointsDeletionDisabledMap, endpointsDeletionDisabledStatus],
  );

  return (
    <Box container display="flex" flexDirection="column" flex="1" id="endpoint-list">
      <Table
        //@ts-expect-error fix this when you are working on it
        columns={columns}
        data={strictSchemaEndpoints}
        defaultSortingKey="hostname"
        entityName={{
          en: {
            singular: 'endpoint',
            plural: 'endpoints',
          },
        }}
      >
        <TableHeaderWrapper
          search={<Table.SearchWithQueryParams queryParams={SEARCH_QUERY_PARAM} />}
          actions={
            <div style={{ marginLeft: 'auto' }}>
              <Button
                icon={<Icon name="Create-add" />}
                isLoading={artescaPlusVeeamDefaultOrOpenModeStatus === 'loading'}
                disabled={artescaPlusVeeamDefaultOrOpenMode === 'default'}
                tooltip={{
                  overlay:
                    artescaPlusVeeamDefaultOrOpenMode === 'default'
                      ? TOOLTIP_ARTESCA_PLUS_VEEAM_DEFAULT_MODE
                      : undefined,
                }}
                label="Create Data Service"
                variant="primary"
                iconOnly={760}
                onClick={() => navigate('/create-dataservice')}
                type="submit"
              />
              <AuthorizedAdvancedMetricsButton />
            </div>
          }
        />
        <Table.SingleSelectableContent rowHeight="h40" separationLineVariant="backgroundLevel1" />
      </Table>
    </Box>
  );
}

export default EndpointList;
