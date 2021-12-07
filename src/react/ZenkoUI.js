// @flow
import {
  Container,
  MainContainer,
  ZenkoUIContainer,
} from './ui-elements/Container';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Activity from './ui-elements/Activity';
import type { AppState } from '../types/state';
import { Banner } from '@scality/core-ui';
import ErrorHandlerModal from './ui-elements/ErrorHandlerModal';
import Loader from './ui-elements/Loader';
import ReauthDialog from './ui-elements/ReauthDialog';
import Routes from './Routes';
import ScrollbarWrapper from './ui-elements/ScrollbarWrapper';
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
            icon={<i className="fas fa-exclamation-triangle" />}
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
        <ZenkoUIContainer>
          <Routes />
          <Activity />
          <ErrorHandlerModal />
        </ZenkoUIContainer>
      );
    }

    return <Loader> Login in </Loader>;
  }

  return (
    <ThemeProvider theme={theme}>
      <ScrollbarWrapper>
        {' '}
        {/* TODO: replace with core-ui scrollbar when colors are set correctly */}
        <MainContainer>
          <ReauthDialog />
          {content()}
        </MainContainer>
      </ScrollbarWrapper>
    </ThemeProvider>
  );
}

export default ZenkoUI;
