import * as L from '../ui-elements/ListLayout';
import { useDispatch, useSelector } from 'react-redux';
import type { AppState } from '../../types/state';
import { EmptyStateContainer } from '../ui-elements/Container';
import EndpointList from './EndpointList';
import { Warning } from '../ui-elements/Warning';
import { push } from 'connected-react-router';

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
          iconClass="fas fa-5x fa-wallet"
          title="Create your first Data Service."
          btnTitle="Create Data Service"
          btnAction={() => dispatch(push('/create-dataservice'))}
        />
      </EmptyStateContainer>
    );
  }

  return (
    <L.Container>
      <EndpointList endpoints={endpoints} locations={locations} />
    </L.Container>
  );
};

export default Endpoints;
