export default function bucket(state = { list: []}, action) {
    switch (action.type){
    case 'UPDATE_BUCKET_LIST':
        return {
            ...state,
            list: action.list,
        };
    default:
        return state;
    }
}
