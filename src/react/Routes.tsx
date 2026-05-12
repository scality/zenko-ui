import { AppContainer, EmptyState, ErrorPage401, Icon, Loader, Sidebar } from '@scality/core-ui';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { type JSX, useCallback, useState } from 'react';
import { matchPath, Navigate, Route, Routes, useLocation } from 'react-router';
import { useAuthLoading } from './AuthLoadingProvider';
import AccountContent from './account/AccountContent';
import AccountCreate from './account/AccountCreate';
import AccountCreateUser from './account/AccountCreateUser';
import Accounts from './account/Accounts';
import AccountUpdateUser from './account/AccountUpdateUser';
import AccountUserAccessKeys from './account/AccountUserAccessKeys';
import CreateAccountPolicy from './account/CreateAccountPolicy';
import Attachments from './account/iamAttachment/Attachments';
import UpdateAccountPolicy from './account/UpdateAccountPolicy';
import DataServiceRoleProvider, { useCurrentAccount } from './DataServiceRoleProvider';
import DataBrowser from './databrowser/DataBrowser';
import EndpointCreate from './endpoint/EndpointCreate';
import Endpoints from './endpoint/Endpoints';
import { ISVSteps } from './ISV/components/ISVSteps';
import LocationEditor from './locations/LocationEditor';
import { Locations } from './locations/Locations';
import ManagementProvider from './ManagementProvider';
import { useConfig, useDeployedMetalk8sInstances } from './next-architecture/ui/ConfigProvider';
import STSProvider from './STSProvider';
import ImportCertificate from './truststore/ImportCertificate';
import Truststore from './truststore/Truststore';
import ReauthDialog from './ui-elements/ReauthDialog';
import { getIsDataConsumerRole, useAuthGroups } from './utils/hooks';

export const RemoveTrailingSlash = ({ ...rest }) => {
  const location = useLocation();

  // If the last character of the url is '/'
  if (location.pathname.match('/.*/$')) {
    return (
      <Navigate
        {...rest}
        to={{
          pathname: location.pathname.replace(/\/+$/, ''),
          search: location.search,
        }}
      />
    );
  } else return null;
};

const RedirectToAccount = () => {
  // To be replace later by react-query or context

  const { account: selectedAccount } = useCurrentAccount();
  const { pathname, search } = useLocation();
  const config = useConfig();

  const { isStorageManager } = useAuthGroups();

  if (selectedAccount) {
    return <Navigate to={`${config.basePath}/accounts/${selectedAccount.Name}${pathname}${search}`} />;
  } else if (isStorageManager) {
    return (
      <EmptyState
        icon="Bucket"
        link={`${config.basePath}/create-account`}
        listedResource={{ singular: 'Bucket', plural: 'Buckets' }}
        resourceToCreate="Account"
      ></EmptyState>
    );
  } else {
    return <ErrorPage401 />;
  }
};

const DataBrowserGuard = ({ children }: { children: JSX.Element }): JSX.Element =>
  getIsDataConsumerRole() ? <ErrorPage401 /> : children;

export function PrivateRoutes({ hideSideBar = false }: { hideSideBar?: boolean }): JSX.Element {
  const { isClientsLoaded } = useAuthLoading();
  const config = useConfig();

  const { isPlatformAdmin } = useAuthGroups();
  const metalK8sInstances = useDeployedMetalk8sInstances();
  const isMetalK8sEnabled = metalK8sInstances.length > 0;
  if (!isClientsLoaded) {
    return (
      <Loader centered>
        <div>Loading clients</div>
      </Loader>
    );
  }

  return (
    <Routes>
      <Route
        path="create-location/*"
        element={
          <DataServiceRoleProvider>
            <LocationEditor />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path="locations/:locationName/edit/*"
        element={
          <DataServiceRoleProvider>
            <LocationEditor />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path={`create-user/*`}
        element={
          <DataServiceRoleProvider>
            <AccountCreateUser />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path={`accounts/:accountName/create-user/*`}
        element={
          <DataServiceRoleProvider>
            <AccountCreateUser />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path={`create-policy/*`}
        element={
          <DataServiceRoleProvider>
            <CreateAccountPolicy />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path="create-account/*"
        element={
          <DataServiceRoleProvider>
            <AccountCreate />
          </DataServiceRoleProvider>
        }
      />

      <Route
        path="create-dataservice/*"
        element={
          <DataServiceRoleProvider>
            <EndpointCreate />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path="dataservices/*"
        element={
          <DataServiceRoleProvider>
            <Endpoints />
          </DataServiceRoleProvider>
        }
      />

      <Route
        path="locations/*"
        element={
          <DataServiceRoleProvider>
            <Locations />
          </DataServiceRoleProvider>
        }
      />
      {isPlatformAdmin && isMetalK8sEnabled && (
        <>
          <Route path="truststore/*" element={<Truststore />} />
          <Route path="truststore/import-certificate/*" element={<ImportCertificate />} />
        </>
      )}
      <Route
        path="isv/configuration/*"
        element={
          <DataServiceRoleProvider>
            <ISVSteps />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path={`accounts/:accountName/policies/:policyArn/attachments/*`}
        element={
          <DataServiceRoleProvider>
            <Attachments />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path={`accounts/:accountName/users/:IAMUserName/update-user/*`}
        element={
          <DataServiceRoleProvider>
            <AccountUpdateUser />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path={`accounts/:accountName/policies/:policyArn/:defaultVersionId/update-policy/*`}
        element={
          <DataServiceRoleProvider>
            <UpdateAccountPolicy />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path={`accounts/:accountName/users/:IAMUserName/access-keys/*`}
        element={
          <DataServiceRoleProvider>
            <AccountUserAccessKeys />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path="accounts/:accountName/users/:IAMUserName/attachments/*"
        element={
          <DataServiceRoleProvider>
            <Attachments />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path="accounts/:accountName/data/buckets/*"
        element={
          <DataBrowserGuard>
            <DataServiceRoleProvider>
              <DataBrowser hideHeader={hideSideBar} />
            </DataServiceRoleProvider>
          </DataBrowserGuard>
        }
      />
      <Route
        path="accounts/:accountName/buckets/*"
        element={
          <DataBrowserGuard>
            <DataServiceRoleProvider>
              <DataBrowser hideHeader={hideSideBar} />
            </DataServiceRoleProvider>
          </DataBrowserGuard>
        }
      />
      <Route
        path="accounts/:accountName/*"
        element={
          <DataServiceRoleProvider>
            <AccountContent />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path="accounts/*"
        element={
          <DataServiceRoleProvider>
            <Accounts />
          </DataServiceRoleProvider>
        }
      />
      <Route
        path="buckets/*"
        element={
          <DataBrowserGuard>
            <DataServiceRoleProvider>
              <RedirectToAccount />
            </DataServiceRoleProvider>
          </DataBrowserGuard>
        }
      />
      <Route path="/" element={<Navigate to="accounts" replace />} />
      <Route path="*" element={<Navigate to={`${config.basePath}/accounts`} replace />} />
    </Routes>
  );
}

function InternalRoutes(): JSX.Element {
  const [isSideBarOpen, setIsSideBarOpen] = useState(
    localStorage.getItem('isSideBarOpen') === null || localStorage.getItem('isSideBarOpen') === 'true',
  );
  const location = useLocation();
  const { isStorageManager, isPlatformAdmin } = useAuthGroups();
  const config = useConfig();

  const isDataConsumerRole = getIsDataConsumerRole();

  const metalK8sInstances = useDeployedMetalk8sInstances();
  const isMetalK8sEnabled = metalK8sInstances.length > 0;
  const navigate = useBasenameRelativeNavigate();

  const doesRouteMatch = useCallback(
    (paths: string | string[]) => {
      if (Array.isArray(paths)) {
        return paths.some((path) => matchPath({ path: config.basePath + path, end: true }, location.pathname));
      } else {
        return !!matchPath({ path: config.basePath + paths, end: true }, location.pathname);
      }
    },
    [location.pathname, config.basePath],
  );

  const routeWithoutSideBars = [
    '/create-account',
    '/create-dataservice',
    '/create-location',
    '/locations/:locations/edit',
    '/accounts/:accountName/create-user',
    '/accounts/:accountName/users/:user/update-user',
    '/accounts/:accountName/create-policy',
    '/isv/configuration',
    '/truststore/import-certificate',
    '/accounts/:accountName/buckets/-/create',
    '/accounts/:accountName/buckets/:bucketName/lifecycle/create',
    '/accounts/:accountName/buckets/:bucketName/lifecycle/edit/:ruleId',
    '/accounts/:accountName/buckets/:bucketName/replication/create',
    '/accounts/:accountName/buckets/:bucketName/replication/edit/:ruleId',
    '/accounts/:accountName/buckets/:bucketName/notifications/create',
    '/accounts/:accountName/buckets/:bucketName/notifications/edit/:ruleId',
    '/accounts/:accountName/buckets/:bucketName/cors',
    '/accounts/:accountName/buckets/:bucketName/policy',
  ];

  const hideSideBar = doesRouteMatch(routeWithoutSideBars);

  const sidebarConfig = {
    onToggleClick: () => {
      localStorage.setItem('isSideBarOpen', (!isSideBarOpen).toString());
      setIsSideBarOpen(!isSideBarOpen);
    },
    hoverable: true,
    expanded: isSideBarOpen,
    actions: [
      {
        label: 'Accounts',
        icon: <Icon name="Account" />,
        onClick: () => {
          navigate('/accounts');
        },
        active:
          doesRouteMatch('/accounts') ||
          doesRouteMatch('/accounts/:accountName') ||
          doesRouteMatch('/accounts/:accountName/properties') ||
          doesRouteMatch('/accounts/:accountName/locations') ||
          doesRouteMatch('/accounts/:accountName/users') ||
          doesRouteMatch('/accounts/:accountName/policies'),
      },
      !isDataConsumerRole && {
        label: 'Data Browser',
        icon: <Icon name="Bucket" />,
        onClick: () => {
          navigate('/buckets');
        },
        active:
          doesRouteMatch('/buckets') ||
          doesRouteMatch('/accounts/:accountName/buckets/*') ||
          doesRouteMatch('/accounts/:accountName/data/buckets/*'),
      },

      isStorageManager && {
        label: 'Locations',
        icon: <Icon name="Location" />,
        onClick: () => {
          navigate('/locations');
        },
        active: doesRouteMatch('/locations'),
      },
      isPlatformAdmin &&
        isMetalK8sEnabled && {
          label: 'Truststore',
          icon: <Icon name="ID-card" />,
          onClick: () => {
            navigate('/truststore');
          },
          active: doesRouteMatch('/truststore'),
        },
      isStorageManager && {
        label: 'Data Services',
        icon: <Icon name="Cubes" />,
        onClick: () => {
          navigate('/dataservices');
        },
        active: doesRouteMatch('/dataservices'),
      },
    ],
  };

  return (
    <>
      <DataServiceRoleProvider>
        <ReauthDialog />
      </DataServiceRoleProvider>
      <AppContainer hasPadding sidebarNavigation={hideSideBar ? null : <Sidebar {...sidebarConfig} />}>
        <RemoveTrailingSlash />
        <ManagementProvider>
          <STSProvider>
            <PrivateRoutes hideSideBar={hideSideBar} />
          </STSProvider>
        </ManagementProvider>
      </AppContainer>
    </>
  );
}

export default InternalRoutes;
