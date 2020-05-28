export default function instances(state = {}, action) {
    switch (action.type){
    case 'INIT_CLIENTS':
        return {
            ...state,
            selectedId: action.instanceId,
        };
    default:
        return state;
    }
}
