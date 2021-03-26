// @noflow

export function getClients(state) {
    return {
        instanceId: state.instances.selectedId,
        managementClient: state.auth.managementClient,
        zenkoClient: state.zenko.zenkoClient,
        stsClient: state.auth.stsClient,
        iamClient: state.iam.iamClient,
    };
}

export function getAccountId(state): ?string {
    return state.auth.selectedAccount?.id;
}
