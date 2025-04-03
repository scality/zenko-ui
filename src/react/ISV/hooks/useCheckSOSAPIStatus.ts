import { useDeployedMetalk8sInstances } from '../../next-architecture/ui/ConfigProvider';
import { useConfig } from '../../next-architecture/ui/ConfigProvider';
import { useAuthGroups } from '../../utils/hooks';

type SOSAPIStatus = 'activated' | 'available' | 'unauthorized' | 'wrongAccess';

/**
 *
 * @returns 'activated' if the SOS API is activated,
 * 'available' if the SOS API is available but not activated (MetalK8s available and user is Platform Admin),
 * 'unauthorized' if the user is not a platform admin,
 * 'wrongAccess' if the user is a platform admin but has no MetalK8s instances
 */
export const useCheckSOSAPIStatus: () => SOSAPIStatus = () => {
  const { features } = useConfig();

  const metalK8sInstances = useDeployedMetalk8sInstances();
  const { isPlatformAdmin } = useAuthGroups();
  const isSOSAPIActivated = features.includes('Veeam');

  const isMetalK8sEnabled = metalK8sInstances.length > 0;

  let status: SOSAPIStatus = 'available';

  if (isSOSAPIActivated) {
    status = 'activated';
  }

  if (!isPlatformAdmin) {
    status = 'unauthorized';
  }

  if (!isMetalK8sEnabled) {
    status = 'wrongAccess';
  }

  return status;
};
