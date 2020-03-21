export default function auth(state = {}, action) {
    switch (action.type) {
    case 'LOG_IN':
        return {
            ...state,
            clients: action.clients,
        };
    default:
        return state;
    }
}
