export default function instances(state = {}, action) {
    switch (action.type){
    case 'LOG_IN':
        return {
            ...state,
            selectedId: action.instanceId,
        };
    default:
        return state;
    }
}
