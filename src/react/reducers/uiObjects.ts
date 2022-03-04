import type { ObjectsUIAction } from '../../types/actions';
import type { ObjectsUIState } from '../../types/state';
import { initialObjectUIState } from './initialConstants';
export default function uiObjects(
  state: ObjectsUIState = initialObjectUIState,
  action: ObjectsUIAction,
) {
  switch (action.type) {
    case 'OPEN_FOLDER_CREATE_MODAL':
      return { ...state, showFolderCreate: true };

    case 'CLOSE_FOLDER_CREATE_MODAL':
      return { ...state, showFolderCreate: false };

    case 'OPEN_OBJECT_UPLOAD_MODAL':
      return { ...state, showObjectUpload: true };

    case 'CLOSE_OBJECT_UPLOAD_MODAL':
      return { ...state, showObjectUpload: false };

    case 'OPEN_OBJECT_DELETE_MODAL':
      return { ...state, showObjectDelete: true };

    case 'CLOSE_OBJECT_DELETE_MODAL':
      return { ...state, showObjectDelete: false };

    default:
      return state;
  }
}