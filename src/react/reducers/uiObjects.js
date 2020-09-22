import { initialObjectUIState } from './initialConstants';

export default function uiObjects(state = initialObjectUIState, action) {
    switch (action.type) {
    case 'OPEN_FOLDER_CREATE_MODAL':
        return {
            ...state,
            showFolderCreate: true,
        };
    case 'CLOSE_FOLDER_CREATE_MODAL':
        return {
            ...state,
            showFolderCreate: false,
        };
    default:
        return state;
    }
}
