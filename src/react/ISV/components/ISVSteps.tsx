import { Stepper, spacing } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/next';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useTheme } from 'styled-components';
import { getPlatformById } from '../platforms';
import ISVApplyActions from './ISVApplyActions';
import { ISVConfiguration } from './ISVConfiguration';
import { ISVStepperContext } from './ISVStepperContext';
import { ISVSummary } from './ISVSummary';

export enum ISVStepsIndexes {
  Configuration,
  ApplyActions,
  Summary,
}

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
