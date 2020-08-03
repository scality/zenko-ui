// @noflow

export function getClients(state) {
    return {
        instanceId: state.instances.selectedId,
        managementClient: state.auth.managementClient,
        s3Client: state.auth.s3Client,
    };
}
