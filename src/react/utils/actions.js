// @noflow

export function getClients(state) {
    return {
        instanceId: state.instances.selectedId,
        managementClient: state.auth.managementClient,
        s3Client: state.s3.s3Client,
    };
}
