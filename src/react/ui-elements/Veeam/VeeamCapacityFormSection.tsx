import { FormGroup, FormSection, Stack } from '@scality/core-ui';
import { Input, Select } from '@scality/core-ui/dist/next';
import { Controller, useFormContext } from 'react-hook-form';
import { unitChoices } from './VeeamConstants';
import { ListItem } from './VeeamTable';
import { useCapacityUnit } from './useCapacityUnit';
import { useEffect } from 'react';
import { useXcoreConfig } from '../../next-architecture/ui/ConfigProvider';

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

type UseClusterCapacityHooks = (xCoreConfig: XCoreConfig) => {
  clusterCapacity: string | undefined;
  clusterCapacityStatus: string;
};

const VeeamCapacityTooltip = () => (
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
    <ListItem>
      Prefilled at 80% of the ARTESCA platform's capacity (recommended).
    </ListItem>
  </ul>
);

export const VeeamCapacityFormWithXcore = ({
  useClusterCapacity,
}: {
  useClusterCapacity: UseClusterCapacityHooks;
}) => {
  const xCoreConfig = useXcoreConfig('run');
  const { clusterCapacity, clusterCapacityStatus } =
    useClusterCapacity(xCoreConfig);
  const { setValue } = useFormContext();

  const { capacityValue, capacityUnit } = useCapacityUnit(
    clusterCapacity || '0',
    true,
  );

  useEffect(() => {
    if (clusterCapacityStatus === 'success') {
      setValue('capacity', capacityValue);
      setValue('capacityUnit', capacityUnit);
    }
  }, [clusterCapacityStatus]);

  return <VeeamCapacityFormSection />;
};

export const VeeamCapacityFormSection = ({
  autoFocusEnabled,
}: {
  autoFocusEnabled?: boolean;
}) => {
  const { register, control, formState } = useFormContext();

  return (
    <FormSection>
      <FormGroup
        id="capacity"
        label="Max Veeam Repository Capacity"
        error={formState.errors.capacity?.message?.toString() ?? ''}
        help="The recommended value is 80% of the platform's total capacity."
        helpErrorPosition="bottom"
        labelHelpTooltip={<VeeamCapacityTooltip />}
        content={
          <Stack direction="horizontal">
            <Input
              id="capacity"
              type="number"
              size="1/3"
              min={1}
              max={999}
              autoFocus={autoFocusEnabled}
              {...register('capacity')}
            />
            <Controller
              name="capacityUnit"
              control={control}
              render={({ field: { value, onChange } }) => {
                return (
                  <>
                    <Select
                      id="capacityUnit"
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
