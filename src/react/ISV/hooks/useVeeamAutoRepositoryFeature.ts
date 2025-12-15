import { useConfig } from '../../next-architecture/ui/ConfigProvider';

export const useVeeamAutoRepositoryFeature = () => {
  const { features } = useConfig();

  return features.includes('VeeamAutoRepository');
};
