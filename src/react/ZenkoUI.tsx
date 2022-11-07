import { Container, MainContainer } from './ui-elements/Container';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Activity from './ui-elements/Activity';
import type { AppState } from '../types/state';
import { Banner, Icon, ScrollbarWrapper } from '@scality/core-ui';
import ErrorHandlerModal from './ui-elements/ErrorHandlerModal';
import Loader from './ui-elements/Loader';
import ReauthDialog from './ui-elements/ReauthDialog';
import Routes from './Routes';
import { ThemeProvider } from 'styled-components';
import { loadAppConfig } from './actions';

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
  const theme = useSelector((state: AppState) => state.uiConfig.theme);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(loadAppConfig());
  }, [dispatch]);

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

    return <Loader> Login in </Loader>;
  }

  return (
    <ThemeProvider theme={theme}>
      <ScrollbarWrapper>
        <MainContainer>
          <ReauthDialog />
          {content()}
        </MainContainer>
      </ScrollbarWrapper>
    </ThemeProvider>
  );
}

export default ZenkoUI;
