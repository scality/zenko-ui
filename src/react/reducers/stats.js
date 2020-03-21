export default function stats(state = {}, action){
    switch (action.type) {
    case 'INSTANCE_STATUS':
        return {
            ...state,
            bucketList: action.status.metrics['item-counts'].bucketList,
        };
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
