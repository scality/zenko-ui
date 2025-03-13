import { FormGroup, FormSection, Stack } from '@scality/core-ui';
import { Input, Select } from '@scality/core-ui/dist/next';
import { Controller, useFormContext } from 'react-hook-form';

import { useEffect } from 'react';
import { useXcoreRuntimeConfig } from '../../next-architecture/ui/ConfigProvider';
import { useShellHooks } from '@scality/module-federation';
import { ListItem } from './ISVApplyActions';
import { unitChoices } from '../constants';
import { useCapacityUnit } from '../hooks/useCapacityUnit';

type XCoreConfig = {
  spec: {
    selfConfiguration: {
      url: string;
      url_alertmanager: string;
      url_prometheus: string;
      url_grafana: string;
    };
  };
};
type ClusterCapacityStatus = 'idle' | 'loading' | 'success' | 'error';
type UseClusterCapacityHooks = (
  xCoreConfig: XCoreConfig,
  getToken: () => Promise<string | null>,
) => {
  clusterCapacity: number;
  clusterCapacityStatus: ClusterCapacityStatus;
};

const CapacityTooltip = () => (
  <ul>
    <ListItem>
      Set your ARTESCA storage capacity limit to be monitored by Veeam (via
      Smart Object Storage API).
    </ListItem>
    <ListItem>
      Keep in mind, going over this limit has no effect on ARTESCA itself, but
      it does trigger a warning in the Veeam UI and can potentially stop backup
      activities.
    </ListItem>
  </ul>
);

export const CapacityFormWithXcore = ({
  useClusterCapacity,
  index,
  bucketNumber,
}: {
  useClusterCapacity: UseClusterCapacityHooks;
  index: number;
  bucketNumber: number;
}) => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const xCoreConfig = useXcoreRuntimeConfig();
  const { clusterCapacity, clusterCapacityStatus } = useClusterCapacity(
    xCoreConfig,
    getToken,
  );
  const { setValue } = useFormContext();
  const { capacityValue, capacityUnit } = useCapacityUnit(
    clusterCapacityStatus === 'success'
      ? clusterCapacity * (0.8 / bucketNumber)
      : 0,
  );
  useEffect(() => {
    if (clusterCapacityStatus === 'success') {
      setValue(`buckets.${index}.capacity`, capacityValue);
      setValue(`buckets.${index}.capacityUnit`, capacityUnit);
    }
  }, [clusterCapacityStatus]);

  return <CapacityFormSection index={index} />;
};

export const CapacityFormSection = ({
  autoFocusEnabled,
  index,
}: {
  autoFocusEnabled?: boolean;
  index: number;
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormSection forceLabelWidth={280}>
      <FormGroup
        id={`buckets.${index}.capacity`}
        label="Max Veeam Repository Capacity"
        error={errors.buckets?.[index]?.capacity?.message?.toString() ?? ''}
        helpErrorPosition="bottom"
        labelHelpTooltip={<CapacityTooltip />}
        content={
          <Stack direction="horizontal">
            <Input
              id={`buckets.${index}.capacity`}
              type="number"
              size="1/3"
              min={1}
              max={1024}
              step={0.01}
              autoFocus={autoFocusEnabled}
              {...register(`buckets.${index}.capacity`)}
            />
            <Controller
              name={`buckets.${index}.capacityUnit`}
              control={control}
              render={({ field: { value, onChange } }) => {
                return (
                  <>
                    <Select
                      menuPosition="fixed"
                      id={`buckets.${index}.capacityUnit`}
                      onChange={onChange}
                      value={value}
                      size="1/3"
                    >
                      {Object.entries(unitChoices).map(([key, value]) => {
                        return (
                          <Select.Option key={key} value={`${value}`}>
                            {key}
                          </Select.Option>
                        );
                      })}
                    </Select>
                  </>
                );
              }}
            ></Controller>
          </Stack>
        }
      />
    </FormSection>
  );
};
