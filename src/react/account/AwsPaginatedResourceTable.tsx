import { useHistory, useRouteMatch } from 'react-router-dom';
import { useIAMClient } from '../IAMProvider';
import { useQueryParams } from '../utils/hooks';
import { AWS_PAGINATED_ENTITIES, useAwsPaginatedEntities } from '../utils/IAMhooks';
import { TitleRow as TableHeader } from '../ui-elements/TableKeyValue';
import React, { ChangeEvent } from 'react';
import { SpacedBox } from '@scality/core-ui/dist/components/spacedbox/SpacedBox';
import { Box, Table } from '@scality/core-ui/dist/next';
import { SearchInput } from '@scality/core-ui/dist/components/searchinput/SearchInput.component';
import { Tooltip } from '@scality/core-ui';
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

type Props = {
  additionalHeaders: JSX.Element;
  columns: JSX.IntrinsicElements;
  query: {
    getResourceQuery: ( iamClient: IAMClient ) => any;
    getEntitiesFromResult:  (data: { Marker?: string | undefined; }) => unknown[];
    prepareData: ( queryResult: AWS_PAGINATED_ENTITIES<unknown>, search: string) => unknown[];
  }
  defaultSortingKey: string;
  getItemKey: string;
  labels: {
    disabledSearchWhileLoading: string;
    pluralResourceName: string;
    singularResourceName: string;
    loading: string;
    errorPreviousHeaders: string;
    errorInTableContent: string;
  }
}

const AwsPaginatedResourceTable = ({additionalHeaders , columns, query: {getResourceQuery, getEntitiesFromResult, prepareData}, defaultSortingKey, getItemKey, labels: {disabledSearchWhileLoading, pluralResourceName, singularResourceName, loading, errorPreviousHeaders, errorInTableContent }} : Props) => {
  const history = useHistory();
  const IAMClient = useIAMClient();
  const queryParams = useQueryParams();
  const match = useRouteMatch();
  const SEARCH_QUERY_PARAM = 'search';
  const search = queryParams.get(SEARCH_QUERY_PARAM);

  const setSearch = (newSearch: string) => {
    queryParams.set(SEARCH_QUERY_PARAM, newSearch);
    history.replace(`${match.url}?${queryParams.toString()}`);
  };

  const queryResult = useAwsPaginatedEntities(getResourceQuery(IAMClient), getEntitiesFromResult);
  const data = prepareData(queryResult, search);

  return (
    <Box height="100%">
      <Table columns={columns} data={data} defaultSortingKey={defaultSortingKey}>
        <TableHeader>
          <Box display="flex" alignItems="center">
            {queryResult.firstPageStatus !== 'loading' &&
            queryResult.firstPageStatus !== 'error' ? (
              data && <SpacedBox mr={12}>
                Total {data.length} {data.length > 1 ? pluralResourceName : singularResourceName}
              </SpacedBox>
            ) : (
              ''
            )}
            <WithTooltipWhileLoading
              isLoading={queryResult.status === 'loading'}
              tooltipOverlay={disabledSearchWhileLoading}
            >
              <SearchInput
                disabled={queryResult.status !== 'success'}
                value={search}
                placeholder={'Search'}
                disableToggle
                onChange={(evt: ChangeEvent<HTMLInputElement>) => {
                  setSearch(evt.target.value);
                }}
              />
            </WithTooltipWhileLoading>
            {queryResult.firstPageStatus === 'loading' ? (
              <SpacedBox ml={12}>{loading}</SpacedBox>
            ) : (
              ''
            )}
            {queryResult.status === 'error' ? (
              <SpacedBox ml={12}>
                {errorPreviousHeaders}
              </SpacedBox>
            ) : (
              ''
            )}
          </Box>
          {additionalHeaders}
        </TableHeader>
        <Table.SingleSelectableContent
          rowHeight="h40"
          separationLineVariant="backgroundLevel1"
          backgroundVariant="backgroundLevel3"
          customItemKey={getItemKey}
        >
          {(Rows) => (
            <>
              {queryResult.firstPageStatus === 'loading' ||
              queryResult.firstPageStatus === 'idle'
                ? loading
                : ''}
              {queryResult.firstPageStatus === 'error'
                ? errorInTableContent
                : ''}
              {queryResult.firstPageStatus === 'success' ? <Rows /> : ''}
            </>
          )}
        </Table.SingleSelectableContent>
      </Table>
    </Box>
  );
}

export default AwsPaginatedResourceTable;