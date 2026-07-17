import { Stepper, spacing } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/next';
import { useTheme } from 'styled-components';
import { ApplyActionsStep } from './steps/ApplyActionsStep';
import { ConfigureStep } from './steps/ConfigureStep';
import { SummaryStep } from './steps/SummaryStep';

const STEPS = [
  { label: 'Configure', Component: ConfigureStep },
  { label: 'Apply Actions', Component: ApplyActionsStep },
  { label: 'Summary', Component: SummaryStep },
] as const;

export const CRRSetupWizard = () => {
  const theme = useTheme();
  return (
    <Box
      height="100%"
      backgroundColor={theme.backgroundLevel4}
      paddingTop={spacing.r16}
      style={{ boxSizing: 'border-box' }}
    >
      <Stepper steps={STEPS} />
    </Box>
  );
};
