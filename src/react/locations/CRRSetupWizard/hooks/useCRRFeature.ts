import { useConfig } from '../../../next-architecture/ui/ConfigProvider';

export const useCRRFeature = () => {
  const { features } = useConfig();

  return features.includes('CRR_CONFIGURATOR');
};
