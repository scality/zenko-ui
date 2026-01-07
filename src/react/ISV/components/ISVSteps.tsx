import { spacing, Stepper } from '@scality/core-ui';
import { createContext, useContext, useMemo } from 'react';
import { ISVConfiguration } from './ISVConfiguration';

import { ISVPlatform } from '../engine/types';

import { useTheme } from 'styled-components';
import { Box } from '@scality/core-ui/dist/next';
import { ISVSummary } from './ISVSummary';
import ISVApplyActions from './ISVApplyActions';

import { useSearchParams } from 'react-router';
import { getPlatformById } from '../platforms';

export enum ISVStepsIndexes {
  Configuration,
  ApplyActions,
  Summary,
}

export type ISVStepperContextType = {
  platform: ISVPlatform;
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

  const platform = useMemo(() => {
    return id ? getPlatformById(id) : undefined;
  }, [id]);

  const contextValue = useMemo(
    () => ({
      platform,
    }),
    [platform],
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
