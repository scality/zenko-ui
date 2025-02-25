import { spacing, Stepper } from '@scality/core-ui';
import { useState, createContext, useContext, useMemo } from 'react';
import { ISVConfiguration } from './ISVConfiguration';

import { ISVConfig, ISVPlatformConfig } from '../types';

import { useTheme } from 'styled-components';
import { Box } from '@scality/core-ui/dist/next';
import { ISVSummary } from './ISVSummary';
import ISVApplyActions from './ISVApplyActions';
import {
  VEEAM_BACKUP_REPLICATION_XML_VALUE,
  VEEAM_OFFICE_365,
} from '../constants';
import { useSearchParams } from 'react-router';
import { Veeam } from '../modules/veeam';
import { Commvault } from '../modules/commvault';
import { VeeamVBO } from '../modules/veeam-vbo';

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
  const [searchParams] = useSearchParams();
  const id = searchParams.get('platform');

  const getApplication = () => {
    switch (id) {
      case 'veeam':
        return VEEAM_BACKUP_REPLICATION_XML_VALUE;
      case 'veeam-vbo':
        return VEEAM_OFFICE_365;
      case 'commvault':
        return 'COMMVAULT';
      default:
        return '';
    }
  };
  const isvModules: ISVPlatformConfig[] = [Veeam, Commvault, VeeamVBO];
  const [config, setConfig] = useState<ISVConfig>(() => ({
    accountName: '',
    enableImmutableBackup: true,
    buckets: [],
    application: getApplication(),
    accountNameType: 'create',
  }));

  const platform = useMemo(() => {
    return isvModules.find((p) => p.id === id);
  }, [id]);

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
        style={{
          boxSizing: 'border-box',
        }}
      >
        <Stepper steps={ISV_STEPS} />
      </Box>
    </ISVStepperContext.Provider>
  );
};
