export function getClients(state) {
    return {
        ...state.auth.clients,
        instanceId: state.instances.selectedId,
    };
}
