import * as L from '../ui-elements/ListLayout';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { EmptyStateContainer } from '../ui-elements/Container';
import EndpointList from './EndpointList';
import { Warning } from '../ui-elements/Warning';
import { push } from 'connected-react-router';
import { AppContainer, Icon } from '@scality/core-ui';

const Endpoints = () => {
  const dispatch = useDispatch();
  const endpoints = useSelector(
    (state: AppState) => state.configuration.latest.endpoints,
  );
  const locations = useSelector(
    (state: AppState) => state.configuration.latest.locations,
  );

  // empty state.
  if (endpoints.length === 0) {
    return (
      <EmptyStateContainer>
        <Warning
          centered={true}
          icon={<Icon name="Wallet" size="5x" />}
          title="Create your first Data Service."
          btnTitle="Create Data Service"
          btnAction={() => dispatch(push('/create-dataservice'))}
        />
      </EmptyStateContainer>
    );
  }

  return (
    <AppContainer.MainContent background="backgroundLevel1">
      <EndpointList endpoints={endpoints} locations={locations} />
    </AppContainer.MainContent>
  );
};

export default Endpoints;
