// @noflow
import { Map } from 'immutable';

export function getClients(state) {
    return {
        ...state.auth.clients,
        instanceId: state.instances.selectedId,
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
