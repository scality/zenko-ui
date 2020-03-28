export default function uiLocation(state = { showDeleteLocation: false }, action) {
    switch (action.type) {
    case 'SELECT_LOCATION':
        return {
            ...state,
            selectedLocationName: action.locationName,
        };
    case 'RESET_SELECT_LOCATION':
        return {
            ...state,
            selectedLocationName: null,
        };
    case 'OPEN_LOCATION_DELETE_DIALOG':
        return {
            ...state,
            showDeleteLocation: true,
        };
    case 'CLOSE_LOCATION_DELETE_DIALOG':
        return {
            ...state,
            showDeleteLocation: false,
        };
    default:
        return state;
    }
}
