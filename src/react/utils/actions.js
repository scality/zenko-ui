// @flow
import type { AppState } from '../../types/state';

export function getClients(state: AppState) {
  return {
    instanceId: state.instances.selectedId,
    managementClient: state.auth.managementClient,
    zenkoClient: state.zenko.zenkoClient,
    stsClient: state.auth.stsClient,
  };
}

export function getAccountId(state: AppState): ?string {
  return state.auth.selectedAccount?.id;
}
