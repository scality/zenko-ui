import { AccountAction } from '../../types/actions';
import { AccountState } from '../../types/state';
import { initialAccountState } from './initialConstants';
export default function account(
  state: AccountState = initialAccountState,
  action: AccountAction,
) {
  switch (action.type) {
    case 'LIST_ACCOUNT_ACCESS_KEY_SUCCESS': {
      return { ...state, accessKeyList: action.accessKeys };
    }

    default:
      return state;
  }
}
