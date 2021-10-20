import { initialUserState } from './initialConstants';

export default function user(state = initialUserState, action) {
  switch (action.type) {
    case 'UPDATE_USER_LIST':
      return {
        ...state,
        list: action.list,
      };
    case 'UPDATE_ACCESS_KEY_LIST':
      if (
        state.accessKeyList.length === action.list.length &&
        action.list.length === 0
      ) {
        return state;
      }
      return {
        ...state,
        accessKeyList: action.list,
      };
    case 'UPDATE_ATTACHED_USER_POLICIES_LIST':
      if (
        state.attachedPoliciesList.length === action.list.length &&
        action.list.length === 0
      ) {
        return state;
      }
      return {
        ...state,
        attachedPoliciesList: action.list,
      };
    case 'UPDATE_GROUPS_FOR_USER_LIST':
      return {
        ...state,
        groupList: action.list,
      };
    case 'DISPLAY_USER':
      return {
        ...state,
        displayedUser: action.user,
      };
    default:
      return state;
  }
}
