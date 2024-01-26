import { Container } from './ui-elements/Container';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Activity from './ui-elements/Activity';
import type { AppState } from '../types/state';
import { Banner, Icon, ScrollbarWrapper } from '@scality/core-ui';
import ErrorHandlerModal from './ui-elements/ErrorHandlerModal';
import Loader from './ui-elements/Loader';
import Routes from './Routes';
import { loadAppConfig } from './actions';
import { useConfig } from './next-architecture/ui/ConfigProvider';
import { useAuth } from './next-architecture/ui/AuthProvider';

function ZenkoUI() {
  const isConfigLoaded = useSelector(
    (state: AppState) => state.auth.isConfigLoaded,
  );
  const configFailure = useSelector(
    (state: AppState) => state.auth.configFailure,
  );
  const configFailureErrorMessage = useSelector((state: AppState) =>
    state.uiErrors.errorType === 'byComponent' ? state.uiErrors.errorMsg : '',
  );
  const dispatch = useDispatch();
  const conf = useConfig();
  const user = useAuth();
  useEffect(() => {
    dispatch(loadAppConfig(conf, user.userData));
  }, [dispatch, conf, user]);

  function content() {
    if (configFailure) {
      return (
        <Container>
          <Banner
            icon={<Icon name="Exclamation-triangle" />}
            title="Error: Unable to load the appplication"
            variant="danger"
          >
            {configFailureErrorMessage}
          </Banner>
        </Container>
      );
    }

    if (isConfigLoaded) {
      return (
        <>
          <Routes />
          <Activity />
          <ErrorHandlerModal />
        </>
      );
    }

    //@ts-expect-error fix this when you are working on it
    return <Loader> Login in </Loader>;
  }

  return <ScrollbarWrapper>{content()}</ScrollbarWrapper>;
}

export default ZenkoUI;
