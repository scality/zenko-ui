import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { Form, FormGroup, FormSection, Stack, Toggle } from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { Button, Input, Select } from '@scality/core-ui/dist/next';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { VEEAM_STEPS, VeeamStepsIndexes } from './VeeamSteps';
import { VEEAMVERSION11, VEEAMVERSION12 } from './VeeamConstants';
import { useXCoreLibrary } from '../../next-architecture/ui/XCoreLibraryProvider';
import { useXcoreConfig } from '../../next-architecture/ui/ConfigProvider';
import prettyBytes from 'pretty-bytes';

const schema = Joi.object({
  name: Joi.string().required(),
  version: Joi.string().required(),
  capacity: Joi.when('version', {
    is: Joi.equal(VEEAMVERSION12),
    then: Joi.number().required().min(1).max(999),
    otherwise: Joi.valid(),
  }),
  capacityUnit: Joi.when('version', {
    is: Joi.equal(VEEAMVERSION12),
    then: Joi.string().required(),
    otherwise: Joi.valid(),
  }),
  enableImmutableBackup: Joi.boolean().required(),
});

type VeeamConfiguration = {
  name: string;
  version: string;
  capacity: string;
  capacityUnit: string;
  enableImmutableBackup: boolean;
};

const Configuration = () => {
  const {
    handleSubmit,
    control,
    register,
    watch,
    formState: { errors, isValid },
    setValue,
  } = useForm<VeeamConfiguration>({
    mode: 'all',
    resolver: joiResolver(schema),
    defaultValues: {
      name: '',
      version: VEEAMVERSION12,
      capacity: '5', //TODO: The default value will be net capacity.
      capacityUnit: 'TiB',
      enableImmutableBackup: true,
    },
  });
  const isVeeam12 = watch('version') === VEEAMVERSION12;
  const onSubmit = () => {
    //TODO: Create account
  };
  const formRef = useRef(null);
  const { next } = useStepper(VeeamStepsIndexes.Configuration, VEEAM_STEPS);
  const xCoreConfig = useXcoreConfig('run');
  const { useClusterCapacity } = useXCoreLibrary();
  const { clusterCapacity, clusterCapacityStatus } =
    useClusterCapacity(xCoreConfig);

  useEffect(() => {
    if (clusterCapacityStatus === 'success') {
      const prettyBytesClusterCapacity = prettyBytes(
        parseInt(clusterCapacity, 10),
        {
          locale: 'en',
          binary: true,
        },
      );

      setValue('capacity', prettyBytesClusterCapacity.split(' ')[0]);
      setValue('capacityUnit', prettyBytesClusterCapacity.split(' ')[1]);
    }
  }, [clusterCapacityStatus]);

  return (
    <Form
      onSubmit={handleSubmit(onSubmit)}
      ref={formRef}
      layout={{
        title: 'Configure ARTESCA for your Use case',
        kind: 'page',
      }}
      rightActions={
        <Stack gap="r16">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              //TODO: Go back to the landing page base on the user profile
            }}
            label="Skip Use case configuration"
          />
          <Button
            type="submit"
            variant="primary"
            label="Continue"
            disabled={!isValid}
            onClick={() => {
              next({});
            }}
          />
        </Stack>
      }
    >
      <FormSection title={{ name: 'Prepare ARTESCA for Veeam' }}>
        <FormGroup
          id="version"
          label="Veeam version"
          direction="vertical"
          labelHelpTooltip="TODO"
          content={
            <Controller
              name="version"
              control={control}
              render={({ field: { onChange, value } }) => {
                return (
                  <Select id="version" onChange={onChange} value={value}>
                    <Select.Option key={VEEAMVERSION12} value={VEEAMVERSION12}>
                      {VEEAMVERSION12}
                    </Select.Option>
                    <Select.Option key={VEEAMVERSION11} value={VEEAMVERSION11}>
                      {VEEAMVERSION11}
                    </Select.Option>
                  </Select>
                );
              }}
            ></Controller>
          }
        />
        <FormGroup
          id="name"
          label="Bucket name"
          direction="vertical"
          required
          labelHelpTooltip="TODO"
          error={errors.name?.message ?? ''}
          content={
            <Input
              id="name"
              type="text"
              autoComplete="off"
              placeholder="Veeam bucket name"
              {...register('name')}
            />
          }
        />
        <FormGroup
          id="enableImmutableBackup"
          label="Immutable backup"
          direction="vertical"
          help="It enables object-lock on the bucket which means backups will be permanent and unchangeable."
          helpErrorPosition="bottom"
          labelHelpTooltip="TODO"
          content={
            <Controller
              name="enableImmutableBackup"
              control={control}
              render={({ field: { value, onChange } }) => {
                return (
                  <Toggle
                    id="enableImmutableBackup"
                    name="enableImmutableBackup"
                    toggle={value}
                    label={value ? 'Active' : 'Inactive'}
                    onChange={onChange}
                  />
                );
              }}
            ></Controller>
          }
        />
        {isVeeam12 ? (
          <FormGroup
            id="capacity"
            label="Max repository capacity"
            direction="vertical"
            error={errors.capacity?.message ?? ''}
            help="The recommended value is 80% of the platform's total capacity."
            helpErrorPosition="bottom"
            labelHelpTooltip="TODO"
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
                      <Select
                        id="capacityUnit"
                        onChange={onChange}
                        value={value}
                        size="2/3"
                      >
                        <Select.Option value={'GiB'}>GiB</Select.Option>
                        <Select.Option value={'TiB'}>TiB</Select.Option>
                        <Select.Option value={'PiB'}>PiB</Select.Option>
                      </Select>
                    );
                  }}
                ></Controller>
              </Stack>
            }
          ></FormGroup>
        ) : (
          <></>
        )}
      </FormSection>
    </Form>
  );
};

export default Configuration;
