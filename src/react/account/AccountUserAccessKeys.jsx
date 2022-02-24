import React, { useMemo } from 'react';
import {
  Route,
  useHistory,
  useLocation,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import { Table, Button } from '@scality/core-ui/dist/next';
import Icon from '@scality/core-ui/dist/components/icon/Icon.component';
import { spacing } from '@scality/core-ui/dist/style/theme';
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
import { formatSimpleDate } from '../utils';
import AccountUserSecretKeyModal from './AccountUserSecretKeyModal';
import { TitleRow as TableHeader } from '../ui-elements/TableKeyValue';
import {
  useAwsPaginatedEntities,
  useAccessKeyOutdatedStatus,
} from '../utils/IAMhooks';
import { Tooltip } from '@scality/core-ui';
import { useTheme } from 'styled-components';
import { Toggle } from '@scality/core-ui';
import TextBadge from "@scality/core-ui/dist/components/textbadge/TextBadge.component";
import { useQuery } from "react-query";

const CreatedOnCell = rowValue => {
  const outdatedAlert = useAccessKeyOutdatedStatus(rowValue);
  return (
    <div>
      {outdatedAlert ? (
        <Tooltip overlay={outdatedAlert} overlayStyle={{ width: '20rem' }}>
          <Icon name={'Exclamation-circle'} color={'statusWarning'} />
        </Tooltip>
      ) : null}
      {rowValue.createdOn}
    </div>
  );
};




const ToggleAccessKeyStatus = rowValue => {
  const IAMClient = useIAMClient();

  const emulateFetch = (_) => {
    console.log("Fetching data...");

    IAMClient.updateAccessKey(rowValue.accessKey, rowValue.status ===  'Active' ? 'Inactive' : 'Active', rowValue.userName)
    console.log("... done");
  };

  const { isLoading, data, refetch } = useQuery(["updateAccessKey", rowValue.accessKey], emulateFetch, {
    refetchOnWindowFocus: false,
    enabled: false // handle refetchs manually
  });

  const handleClick = (rowValue) => {
    refetch(rowValue).then(r => console.log('reftch call'));
  };

  return <div>
    <Toggle
        toggle={rowValue.status}
        label={rowValue.status ? 'Active' : 'Inactive'}
        onChange={() => {
          console.log(!rowValue.status)
          return handleClick(!rowValue.status);
        }}
    />
  </div>

};


const AccountUserAccessKeys = () => {
  const { pathname } = useLocation();
  const { IAMUserName } = useParams();
  const history = useHistory();
  const IAMClient = useIAMClient();
  const { url } = useRouteMatch();
  const theme = useTheme();

  const {
    data: accessKeysResult,
    status: accessKeysStatus,
  } = useAwsPaginatedEntities(
    {
      queryKey: ['listIAMUserAccessKey', IAMUserName],
      queryFn: (_ctx, marker) => IAMClient.listAccessKeys(IAMUserName, marker),
      enabled: IAMClient !== null,
    },
    data => data.AccessKeyMetadata,
  );







  const data = useMemo(() => {
    if (accessKeysStatus === 'success') {
      return accessKeysResult.map(accesskey => {
        return {
          accessKey: accesskey.AccessKeyId,
          createdOn: formatSimpleDate(accesskey.CreateDate),
          status: accesskey.Status,
        };
      });
    } else {
      return [];
    }
  }, [accessKeysStatus, accessKeysResult]);



  const columns = [
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
      Cell: value => CreatedOnCell(value.row.original),
      cellStyle: {
        minWidth: '10rem',
        textAlign: 'right',
        paddingRight: spacing.sp32,
      },
    },
    {
      Header: 'Status',
      accessor: 'status',
      cellStyle: {
        textAlign: 'right',
      },
      Cell: value => ToggleAccessKeyStatus(value.row.original),
    },
  ];

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
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

      <div style={{ flex: 1, backgroundColor: theme.brand.backgroundLevel3 }}>
        <Table columns={columns} data={data} defaultSortingKey={'health'}>
          <TableHeader
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingTop: spacing.sp16,
            }}
          >
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
            separationLineVariant="backgroundLevel1"
            backgroundVariant="backgroundLevel3"
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
