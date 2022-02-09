import React, { useMemo } from 'react';
import {
  Route,
  useHistory,
  useLocation,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import styled from 'styled-components';
import { Table, Button } from '@scality/core-ui/dist/next';

import { BreadcrumbAccount } from '../ui-elements/Breadcrumb';
import * as L from '../ui-elements/ListLayout5';
import {
  Head,
  HeadCenter,
  HeadLeft,
  HeadTitle,
  IconCircle,
} from '../ui-elements/ListLayout';
import { useIAMClient } from '../IAMProvider';
import { useQuery } from 'react-query';
import { formatSimpleDate } from '../utils';
import AccountUserSecretKeyModal from './AccountUserSecretKeyModal';

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const AccountUserAccessKeys = () => {
  const { pathname } = useLocation();
  const { IAMUserName } = useParams();
  const history = useHistory();
  const IAMClient = useIAMClient();
  const { url } = useRouteMatch();

  // IAMClient.listAccessKeys(user.UserName)
  const accessKeysQuery = useQuery({
    queryKey: ['listIAMClientUserAccessKeys', IAMUserName],
    queryFn: () => {
      return IAMClient.listAccessKeys(IAMUserName);
    },
    enabled: IAMClient !== null,
  });

  const columns = useMemo(() => {
    return [
      {
        Header: 'Access Keys',
        accessor: 'accessKey',
        cellStyle: {
          minWidth: '20rem',
        },
      },
      {
        Header: 'Created On',
        accessor: 'createdOn',
      },
      {
        Header: 'Status',
        accessor: 'status',
      },
    ];
  }, []);

  const data = useMemo(() => {
    return (
      accessKeysQuery.data?.AccessKeyMetadata?.map(accesskey => {
        const createdOn = formatSimpleDate(accesskey.CreateDate);
        return {
          accessKey: accesskey.AccessKeyId,
          createdOn: createdOn,
          status: accesskey.Status,
        };
      }) ?? []
    );
  }, [accessKeysQuery.data]);

  return (
    <div style={{ height: '100%' }}>
      <L.BreadcrumbContainer>
        <BreadcrumbAccount pathname={pathname} />
      </L.BreadcrumbContainer>
      <Head>
        <HeadLeft>
          {' '}
          <IconCircle className="fas fa-key"></IconCircle>{' '}
        </HeadLeft>
        <HeadCenter>
          <HeadTitle> {IAMUserName} </HeadTitle>
        </HeadCenter>
      </Head>

      <div style={{ height: '100%' }}>
        <Table columns={columns} data={data} defaultSortingKey={'health'}>
          <TableHeader>
            <Table.SearchWithQueryParams
              displayedName={{
                singular: 'person',
                plural: 'persons',
              }}
            />
            <Button
              icon={<i className="fas fa-plus" />}
              label="Create Access Keys"
              variant="primary"
              onClick={() => history.push('access-keys/create')}
              type="submit"
            />
          </TableHeader>
          <Table.SingleSelectableContent
            rowHeight="h40"
            separationLineVariant="backgroundLevel3"
            backgroundVariant="backgroundLevel1"
          />
        </Table>
      </div>
      <Route path={`${url}/create`}>
        <AccountUserSecretKeyModal IAMUserName={IAMUserName} />
      </Route>
    </div>
  );
};

export default AccountUserAccessKeys;
