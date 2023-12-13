import VeeamTable from './VeeamTable';
import VeeamConfiguration from './VeeamConfiguration';
import { VeeamSummary } from './VeeamSummary';
import { Stepper } from '@scality/core-ui';

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
  return (
    <div style={{ height: '100%' }}>
      <Stepper steps={VEEAM_STEPS} />
    </div>
  );
}
