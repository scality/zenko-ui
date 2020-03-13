export default function pensieveClient(state = {}, action){
    switch (action.type) {
    case 'CREATE_PENSIEVE_CLIENT':
        return {
            ...state,
            client: action.client,
        };
    default:
        return state;
    }
}
