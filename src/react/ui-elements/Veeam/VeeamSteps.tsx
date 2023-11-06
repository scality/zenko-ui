import VeeamTable from './VeeamTable';
import VeeamConfiguration from './VeeamConfiguration';
import { VeeamSummary } from './VeeamSummary';
import { Stepper } from '@scality/core-ui';

export const VEEAM_STEPS = [
  {
    label: 'Configuration',
    Component: VeeamConfiguration,
  },
  {
    label: 'Repository Table',
    Component: VeeamTable,
  },
  {
    label: 'Repository Summary',
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
    <div style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
      <Stepper steps={VEEAM_STEPS} />
    </div>
  );
}
