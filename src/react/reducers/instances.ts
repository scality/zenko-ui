import type { InstancesState } from '../../types/state';
import type { SelectInstanceAction } from '../../types/actions';
import { initialInstancesState } from './initialConstants';
export default function instances(
  state: InstancesState = initialInstancesState,
  action: SelectInstanceAction,
) {
  switch (action.type) {
    case 'SELECT_INSTANCE':
      return { ...state, selectedId: action.selectedId };

    default:
      return state;
  }
}