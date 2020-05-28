// @noflow
import { Map } from 'immutable';

export function getClients(state) {
    return {
        instanceId: state.instances.selectedId,
        managementClient: state.auth.managementClient,
        s3Client: state.auth.s3Client,
    };
}

// https://redux.js.org/recipes/structuring-reducers/initializing-state
export function userListToMap(users: Array<Instance>): Map<UserId, User> {
    if (!users) {
        return Map();
    }
    return users.reduce(
        (us, v) => us.set(v.UserId, v), Map());
}
