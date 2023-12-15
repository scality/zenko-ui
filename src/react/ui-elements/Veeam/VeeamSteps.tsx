import VeeamTable from './VeeamTable';
import VeeamConfiguration from './VeeamConfiguration';
import { VeeamSummary } from './VeeamSummary';
import { Stepper, spacing } from '@scality/core-ui';
import { useTheme } from 'styled-components';

export const VEEAM_STEPS = [
  {
    label: 'Configure Veeam',
    Component: VeeamConfiguration,
  },
  {
    label: 'Apply Actions',
    Component: VeeamTable,
  },
  {
    label: 'Summary',
    Component: VeeamSummary,
  },
] as const;

export enum VeeamStepsIndexes {
  Configuration,
  Table,
  Summary,
}

export default function VeeamSteppers() {
  const theme = useTheme();
  return (
    <div
      style={{
        height: '100%',
        backgroundColor: theme.backgroundLevel4,
        paddingTop: spacing.r16,
      }}
    >
      <Stepper steps={VEEAM_STEPS} />
    </div>
  );
}
