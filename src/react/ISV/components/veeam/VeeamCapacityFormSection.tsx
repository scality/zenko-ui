import { FormGroup, FormSection, Stack } from '@scality/core-ui';
import { Input, Select } from '@scality/core-ui/dist/next';
import { useShellHooks } from '@scality/module-federation';

import { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useXcoreRuntimeConfig } from '../../../next-architecture/ui/ConfigProvider';
import { unitChoices } from '../../constants';
import { useCapacityUnit } from '../../hooks/useCapacityUnit';
import { VeeamCapacityTooltip } from '../shared/PlatformTooltips';

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

export const VeeamCapacityFormWithXcore = ({ useClusterCapacity }: { useClusterCapacity: UseClusterCapacityHooks }) => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();
  const xCoreConfig = useXcoreRuntimeConfig();
  const { clusterCapacityStatus } = useClusterCapacity(xCoreConfig, getToken);
  const { setValue } = useFormContext();
  const { capacityValue, capacityUnit } = useCapacityUnit(0);
  useEffect(() => {
    if (clusterCapacityStatus === 'success') {
      setValue('capacity', capacityValue);
      setValue('capacityUnit', capacityUnit);
    }
  }, [clusterCapacityStatus]);

  return <VeeamCapacityFormSection />;
};

export const VeeamCapacityFormSection = ({ autoFocusEnabled }: { autoFocusEnabled?: boolean }) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormSection>
      <FormGroup
        id="capacity"
        label="Max Capacity"
        error={errors.capacity?.message?.toString() ?? ''}
        helpErrorPosition="bottom"
        labelHelpTooltip={<VeeamCapacityTooltip />}
        content={
          <Stack direction="horizontal">
            <Input
              id="capacity"
              type="number"
              size="1/3"
              min={1}
              max={1024}
              step={0.01}
              autoFocus={autoFocusEnabled}
              {...register('capacity')}
            />
            <Controller
              name="capacityUnit"
              control={control}
              render={({ field: { value, onChange } }) => {
                return (
                  <>
                    <Select menuPosition="fixed" id="capacityUnit" onChange={onChange} value={value} size="1/3">
                      {Object.entries(unitChoices).map(([key]) => {
                        return (
                          <Select.Option key={key} value={key}>
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
