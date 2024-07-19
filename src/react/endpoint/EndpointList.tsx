import { ConstrainedText, Icon, Wrap, spacing } from '@scality/core-ui';
import { Box, Button, CopyButton, Table } from '@scality/core-ui/dist/next';

import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import { Endpoint, Hostname, LocationName } from '../../types/config';
import { renderLocation } from '../locations/utils';
import { LocationInfo } from '../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import {
  AuthorizedAdvancedMetricsButton,
  cloudServerDashboard,
} from './AdvancedMetricsButton';
import { DeleteEndpoint } from './DeleteEndpoint';
import { TableHeaderWrapper } from '../ui-elements/Table';
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
  const history = useHistory();

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
              <ConstrainedText
                text={
                  <span style={{ paddingRight: spacing.r14 }}>{hostName}</span>
                }
                lineClamp={2}
              />
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
          const location = locations.find(
            (location) => location.name === locationName,
          );
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
          return (
            <DeleteEndpoint
              hostname={original.hostname}
              isBuiltin={original.isBuiltin}
            />
          );
        },
      },
    ],
    [locations],
  );

  return (
    <Box display="flex" flexDirection="column" flex="1" id="endpoint-list">
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
          search={
            <Table.SearchWithQueryParams queryParams={SEARCH_QUERY_PARAM} />
          }
          actions={
            <div style={{ marginLeft: 'auto' }}>
              <Button
                icon={<Icon name="Create-add" />}
                label="Create Data Service"
                variant="primary"
                onClick={() => history.push('/create-dataservice')}
                type="submit"
              />
              <AuthorizedAdvancedMetricsButton
                dashboard={cloudServerDashboard}
              />
            </div>
          }
        />
        <Table.SingleSelectableContent
          rowHeight="h40"
          separationLineVariant="backgroundLevel1"
        />
      </Table>
    </Box>
  );
}

export default EndpointList;
