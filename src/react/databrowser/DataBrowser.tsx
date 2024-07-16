import {
  Route,
  Switch,
  useHistory,
  useLocation,
  useParams,
  useRouteMatch,
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { AppState } from '../../types/state';
import { Breadcrumb, breadcrumbPathsBuckets } from '../ui-elements/Breadcrumb';
import Buckets from './buckets/Buckets';
import { EmptyStateContainer } from '../ui-elements/Container';
import ListLayoutButtons from './HeaderButtons';
import Objects from './objects/Objects';
import { Warning } from '../ui-elements/Warning';
import { clearError } from '../actions';
import ObjectLockSetting from './buckets/ObjectLockSetting';
import ObjectLockSettingOnObject from './objects/ObjectLockSetting';
import { useAccounts, useQueryParams } from '../utils/hooks';
import { AppContainer, EmptyState, Icon } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/next';
import { useS3Client } from '../next-architecture/ui/S3ClientProvider';
import Loader from '../ui-elements/Loader';

export default function DataBrowser() {
  const dispatch = useDispatch();
  const history = useHistory();
  const { accountName } = useParams<{ accountName: string }>();
  const { accounts } = useAccounts();
  const hasError = useSelector(
    (state: AppState) =>
      !!state.uiErrors.errorMsg && state.uiErrors.errorType === 'byComponent',
  );
  const errorMessage = useSelector(
    (state: AppState) => state.uiErrors.errorMsg,
  );
  const { pathname } = useLocation();
  const query = useQueryParams();
  const prefixPath = query.get('prefix');
  const { path } = useRouteMatch();

  const s3Client = useS3Client();

  if (!s3Client.config.credentials?.accessKeyId) {
    return (
      <Loader>
        <>Authenticating...</>
      </Loader>
    );
  }

  // NOTE: create-bucket page has its own way to manage "byComponent" errors.
  if (hasError) {
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          icon={<Icon name="Exclamation-triangle" size="5x" />}
          title={errorMessage || 'An unexpected error has occurred.'}
          btnTitle="Display buckets"
          btnAction={() => {
            dispatch(clearError());
            history.push('/buckets');
          }}
        />
      </EmptyStateContainer>
    );
  }

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon="Bucket"
        link="/create-account"
        listedResource={{
          singular: 'Bucket',
          plural: 'Buckets',
        }}
        resourceToCreate="Account"
      />
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <AppContainer.ContextContainer>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Breadcrumb
            breadcrumbPaths={breadcrumbPathsBuckets(
              pathname,
              prefixPath,
              accountName,
            )}
          />
          <Route path={`${path}/:bucketName`} component={ListLayoutButtons} />
        </Box>
      </AppContainer.ContextContainer>

      <Switch>
        <Route
          exact
          path={`${path}/:bucketName/retention-setting`}
          component={ObjectLockSetting}
        />
        <Route
          exact
          path={`${path}/:bucketName/objects/retention-setting`}
          component={ObjectLockSettingOnObject}
        />
        <Route
          exact
          strict
          path={`${path}/:bucketName/objects`}
          component={Objects}
        />
        <Route path={`${path}/:bucketName/objects/*`} component={Objects} />
        <Route path={`${path}/:bucketName?`} component={Buckets} />
      </Switch>
    </Box>
  );
}
