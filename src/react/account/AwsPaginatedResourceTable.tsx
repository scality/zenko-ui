import { ChangeEvent } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { TableItemCount } from '@scality/core-ui/dist/components/tablev2/Search';
import { Tooltip, Wrap, spacing } from '@scality/core-ui';
import { Box, Table } from '@scality/core-ui/dist/next';
import { SearchInput } from '@scality/core-ui/dist/components/searchinput/SearchInput.component';

import { useIAMClient } from '../IAMProvider';
import { useQueryParams } from '../utils/hooks';
import {
  AWS_PAGINATED_ENTITIES,
  AWS_PAGINATED_QUERY,
  useAwsPaginatedEntities,
} from '../utils/IAMhooks';
import IAMClient from '../../js/IAMClient';

const WithTooltipWhileLoading = ({
  children,
  isLoading,
  tooltipOverlay,
}: {
  tooltipOverlay: string;
  isLoading?: boolean;
  children: JSX.Element;
}) => (
  <>
    {isLoading ? (
      <Tooltip overlay={tooltipOverlay}>{children}</Tooltip>
    ) : (
      children
    )}
  </>
);

export type Props<ENTITY, PREPARED_ENTITY = ENTITY> = {
  additionalHeaders: JSX.Element;
  columns: JSX.IntrinsicElements;
  query: {
    getResourceQuery: (
      iamClient?: IAMClient | null,
    ) => AWS_PAGINATED_QUERY<{ Marker?: string }, ENTITY>;
    getEntitiesFromResult: (data: { Marker?: string | undefined }) => ENTITY[];
    prepareData: (
      queryResult: AWS_PAGINATED_ENTITIES<ENTITY>,
    ) => PREPARED_ENTITY[];
    filterData?: (
      entities: PREPARED_ENTITY[],
      search?: string | null,
    ) => PREPARED_ENTITY[];
  };
  defaultSortingKey: string;
  getItemKey: string;
  labels: {
    disabledSearchWhileLoading: string;
    pluralResourceName: string;
    singularResourceName: string;
    loading: string;
    errorPreviousHeaders: string;
    errorInTableContent: string;
  };
};

const SEARCH_QUERY_PARAM = 'search';

const AwsPaginatedResourceTable = <ENTITY, PREPARED_ENTITY = ENTITY>({
  additionalHeaders,
  columns,
  query: { getResourceQuery, getEntitiesFromResult, prepareData, filterData },
  defaultSortingKey,
  getItemKey,
  labels: {
    disabledSearchWhileLoading,
    pluralResourceName,
    singularResourceName,
    loading,
    errorPreviousHeaders,
    errorInTableContent,
  },
}: Props<ENTITY, PREPARED_ENTITY>) => {
  const history = useHistory();
  const IAMClient = useIAMClient();
  const queryParams = useQueryParams();
  const match = useRouteMatch();
  const search = queryParams.get(SEARCH_QUERY_PARAM);

  const queryResult = useAwsPaginatedEntities(
    getResourceQuery(IAMClient),
    getEntitiesFromResult,
  );
  const preparedData = prepareData(queryResult);

  const setSearch = (newSearch: string) => {
    queryParams.set(SEARCH_QUERY_PARAM, newSearch);
    history.replace(`${match.url}?${queryParams.toString()}`);
  };

  const data = (() => {
    if (filterData) {
      return filterData(preparedData, search);
    }
    return preparedData;
  })();

  return (
    <Box height="100%">
      <Table
        //@ts-expect-error fix this when you are working on it
        columns={columns}
        //@ts-expect-error fix this when you are working on it
        data={data}
        defaultSortingKey={defaultSortingKey}
        status={queryResult.firstPageStatus}
        entityName={{
          en: {
            singular: singularResourceName,
            plural: pluralResourceName,
          },
        }}
      >
        <Wrap style={{ padding: spacing.r16 }}>
          <Box display="flex" alignItems="center">
            {queryResult.firstPageStatus !== 'loading' &&
            queryResult.firstPageStatus !== 'error'
              ? data &&
                filterData && (
                  <TableItemCount
                    locale="en"
                    count={data.length}
                    entity={{
                      singular: singularResourceName,
                      plural: pluralResourceName,
                    }}
                  />
                )
              : ''}
            <WithTooltipWhileLoading
              isLoading={queryResult.status === 'loading'}
              tooltipOverlay={disabledSearchWhileLoading}
            >
              {filterData ? (
                <SearchInput
                  disabled={queryResult.status !== 'success'}
                  value={search}
                  placeholder={'Search'}
                  disableToggle
                  onReset={() => {
                    queryParams.delete(SEARCH_QUERY_PARAM);
                    history.push(`${match.url}?${queryParams.toString()}`);
                  }}
                  onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                    setSearch(evt.target.value);
                  }}
                />
              ) : (
                <Table.SearchWithQueryParams
                  queryParams={SEARCH_QUERY_PARAM}
                  disabled={queryResult.status !== 'success'}
                />
              )}
            </WithTooltipWhileLoading>
            {queryResult.firstPageStatus === 'loading' ? (
              <Box ml={12}>{loading}</Box>
            ) : (
              ''
            )}
            {queryResult.status === 'error' ? (
              <Box ml={12}>{errorPreviousHeaders}</Box>
            ) : (
              ''
            )}
          </Box>
          {additionalHeaders}
        </Wrap>
        <Table.SingleSelectableContent
          rowHeight="h40"
          separationLineVariant="backgroundLevel1"
          //@ts-expect-error fix this when you are working on it
          customItemKey={getItemKey}
        ></Table.SingleSelectableContent>
      </Table>
    </Box>
  );
};

export default AwsPaginatedResourceTable;
