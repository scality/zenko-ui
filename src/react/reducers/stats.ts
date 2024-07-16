import { StatsAction } from '../../types/actions';
import { StatsState } from '../../types/state';
import { initialStatsState } from './initialConstants';
export default function stats(
  state: StatsState = initialStatsState,
  action: StatsAction,
): StatsState {
  switch (action.type) {
    case 'INSTANCE_STATUS': {
      const bucketList =
        action.status?.metrics?.['item-counts']?.bucketList || [];
      return { ...state, bucketList };
    }

    default:
      return state;
  }
}
