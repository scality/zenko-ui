import { spacing, Stepper } from '@scality/core-ui';
import { useMemo } from 'react';
import { ISVConfiguration } from './ISVConfiguration';
import { useTheme } from 'styled-components';
import { Box } from '@scality/core-ui/dist/next';
import { ISVSummary } from './ISVSummary';
import ISVApplyActions from './ISVApplyActions';
import { useSearchParams } from 'react-router';
import { getPlatformById } from '../platforms';
import { ISVStepperContext } from './ISVStepperContext';

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
