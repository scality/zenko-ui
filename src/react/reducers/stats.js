export default function stats(state = {}, action){
    switch (action.type) {
    case 'RECEIVE_INSTANCE_STATS':
        if (!action.stats) {
            return state;
        }
        return {
            ...state,
            allStats: action.stats,
            bucketList: action.stats.stats['item-counts'].bucketList,
        };
    default:
        return state;
    }
}
