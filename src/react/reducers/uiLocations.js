import { initialLocationsUIState } from './initialConstants';

export default function uiLocations(state = initialLocationsUIState, action) {
    switch (action.type) {
    case 'OPEN_LOCATION_DELETE_DIALOG':
        return {
            ...state,
            showDeleteLocation: action.locationName,
        };
    case 'CLOSE_LOCATION_DELETE_DIALOG':
        return {
            ...state,
            showDeleteLocation: '',
        };
    default:
        return state;
    }
}
