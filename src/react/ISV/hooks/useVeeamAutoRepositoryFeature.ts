import { useConfig } from '../../next-architecture/ui/ConfigProvider';

/**
 * Hook to check if the Veeam auto-repository creation feature is enabled
 * @returns true if the feature flag is present in Zenko UI configuration
 */
export const useVeeamAutoRepositoryFeature = () => {
  const { features } = useConfig();

  return features.includes('VeeamAutoRepository');
};
