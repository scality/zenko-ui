import { ConstrainedText, Icon, Wrap } from '@scality/core-ui';
import { Box, Button, Table } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import type { Endpoint, Hostname, LocationName } from '../../types/config';
import { renderLocation } from '../locations/utils';
import { LocationInfo } from '../next-architecture/adapters/accounts-locations/ILocationsAdapter';
import { Clipboard } from '../ui-elements/Clipboard';
import * as T from '../ui-elements/Table';
import {
  AuthorizedAdvancedMetricsButton,
  cloudServerDashboard,
} from './AdvancedMetricsButton';
import { DeleteEndpoint } from './DeleteEndpoint';

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
          paddingLeft: '18px',
        },
        Cell({ value: hostName }: { value: Hostname }) {
          return (
            <Wrap paddingRight="2rem">
              <ConstrainedText
                text={
                  <span style={{ paddingRight: spacing.sp14 }}>{hostName}</span>
                }
                lineClamp={2}
              />
              <Clipboard text={hostName} />
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
            <T.Actions>
              <DeleteEndpoint
                hostname={original.hostname}
                isBuiltin={original.isBuiltin}
              />
            </T.Actions>
          );
        },
      },
    ],
    [locations],
  );

  return (
    <Box display="flex" flexDirection="column" flex="1" id="endpoint-list">
      <T.Container>
        <Table
          //@ts-expect-error fix this when you are working on it
          columns={columns}
          data={strictSchemaEndpoints}
          defaultSortingKey="hostname"
        >
          <T.SearchContainer>
            <T.Search>
              <Table.SearchWithQueryParams
                displayedName={{
                  singular: 'endpoint',
                  plural: 'endpoints',
                }}
                queryParams={SEARCH_QUERY_PARAM}
              />
            </T.Search>
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
          </T.SearchContainer>

          <Table.SingleSelectableContent
            rowHeight="h40"
            separationLineVariant="backgroundLevel1"
            backgroundVariant="backgroundLevel2"
          />
        </Table>
      </T.Container>
    </Box>
  );
}

export default EndpointList;
