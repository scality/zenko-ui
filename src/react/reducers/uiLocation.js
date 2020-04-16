import {initialLocationsUIState} from './initialConstants';

export default function uiLocation(state = initialLocationsUIState, action) {
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
    case 'EDIT_LOCATION':
        return {
            ...state,
            locationEditing: action.location,
        };
    case 'RESET_EDIT_LOCATION':
        return {
            ...state,
            locationEditing: null,
        };
    default:
        return state;
    }
}
