import { spacing, Stepper } from '@scality/core-ui';
import { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { ISVConfiguration } from './ISVConfiguration';
import { ISVConfig, ISVPlatformConfig } from '../types';
import { isvModules } from '../modules';
import { useTheme } from 'styled-components';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box } from '@scality/core-ui/dist/next';
import { ISVSummary } from './ISVSummary';
import ISVApplyActions from './ISVApplyActions';

export enum ISVStepsIndexes {
  Configuration,
  ApplyActions,
  Summary,
}

type ISVStepperContextType = {
  platform: ISVPlatformConfig;
  config: ISVConfig;
  setConfig: (config: ISVConfig) => void;
};

export const ISVStepperContext = createContext<
  ISVStepperContextType | undefined
>(undefined);

export const useISVStepper = () => {
  const context = useContext(ISVStepperContext);
  if (!context) {
    throw new Error('useISVStepper must be used within ISVStepperProvider');
  }
  return context;
};

export const ISV_STEPS = [
  {
    label: 'Configure',
    Component: ISVConfiguration,
  },
  {
    label: 'Apply Actions',
    Component: ISVApplyActions,
  },
  {
    label: 'Summary',
    Component: ISVSummary,
  },
] as const;

export const ISVSteps = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('platform');

  const [config, setConfig] = useState<ISVConfig>(() => ({
    accountName: '',
    enableImmutableBackup: true,
    buckets: [],
  }));

  const platform = useMemo(() => {
    return isvModules.find((p) => p.id === id);
  }, [id]);

  useEffect(() => {
    if (!platform && id) {
      navigate('/isv');
    }
    if (platform.id === 'veeam') {
      setConfig({
        ...config,
        application: '',
      });
    }
  }, [platform, id, navigate]);

  if (!platform) {
    return null;
  }

  const contextValue = useMemo(
    () => ({
      platform,
      config,
      setConfig,
    }),
    [platform, config],
  );

  return (
    <ISVStepperContext.Provider value={contextValue}>
      <Box
        height="100%"
        backgroundColor={theme.backgroundLevel4}
        paddingTop={spacing.r16}
      >
        <Stepper steps={ISV_STEPS} />
      </Box>
    </ISVStepperContext.Provider>
  );
};
