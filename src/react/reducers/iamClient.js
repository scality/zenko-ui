export default function iamClient(state = {}, action){
    console.log('action!!!', action);
    switch (action.type) {
    case 'CREATE_IAM_CLIENT':
        return {
            ...state,
            client: action.client,
        };
    default:
        return state;
    }
}
