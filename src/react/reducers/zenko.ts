import type { ZenkoAction } from '../../types/actions';
import type { ZenkoState } from '../../types/state';
import { initialZenkoState } from './initialConstants';
export default function (
  state: ZenkoState = initialZenkoState,
  action: ZenkoAction,
): ZenkoState {
  switch (action.type) {
    case 'SET_ZENKO_CLIENT':
      return { ...state, zenkoClient: action.zenkoClient };

    case 'ZENKO_CLIENT_WRITE_SEARCH_LIST':
    case 'LIST_OBJECTS_SUCCESS':
    case 'ZENKO_CLEAR_ERROR':
      return {
        ...state,
        error: {
          message: null,
          code: null,
          type: null,
          target: null,
        },
      };

    case 'ZENKO_HANDLE_ERROR':
      return {
        ...state,
        error: {
          message: action.errorMsg,
          code: action.errorCode,
          type: action.errorType,
          target: action.errorTarget,
        },
      };

    default:
      return state;
  }
}