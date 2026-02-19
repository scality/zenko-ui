import { Banner, Icon, ScrollbarWrapper } from '@scality/core-ui';
import { useAuthLoading } from './AuthLoadingProvider';
import Routes from './Routes';
import Activity from './ui-elements/Activity';
import { Container } from './ui-elements/Container';
import ErrorHandlerModal from './ui-elements/ErrorHandlerModal';
import Loader from './ui-elements/Loader';

function ZenkoUI() {
  const { isConfigLoaded, configFailure, configFailureErrorMessage } = useAuthLoading();

  function content() {
    if (configFailure) {
      return (
        <Container>
          <Banner
            icon={<Icon name="Exclamation-circle" />}
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
