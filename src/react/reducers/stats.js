export default function stats(state = {}, action){
    switch (action.type) {
    case 'RECEIVE_INSTANCE_STATS':
        if (!action.stats) {
            return state;
        }
        return {
            ...state,
            allStats: action.stats,
        };
    default:
        return state;
    }
}
