import { FormGroup, FormSection, Stack } from '@scality/core-ui';
import { Input, Select } from '@scality/core-ui/dist/next';
import { Controller, useFormContext } from 'react-hook-form';
import { unitChoices } from './VeeamConstants';

export const VeeamCapacityFormSection = () => {
  const { register, control, formState } = useFormContext();

  return (
    <FormSection>
      <FormGroup
        id="capacity"
        label="Max Veeam Repository Capacity"
        direction="vertical"
        error={formState.errors.capacity?.message ?? ''}
        help="The recommended value is 80% of the platform's total capacity."
        helpErrorPosition="bottom"
        content={
          <Stack direction="horizontal">
            <Input
              id="capacity"
              type="number"
              // @ts-expect-error - TODO: Fix the type of the size props in Input component
              size="1/3"
              min={1}
              max={999}
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
                      size="2/3"
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
