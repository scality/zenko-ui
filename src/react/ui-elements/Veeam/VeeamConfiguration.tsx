import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import { Form, FormGroup, FormSection, Stack, Toggle } from '@scality/core-ui';
import { Button, Input, Select } from '@scality/core-ui/dist/next';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import VeeamTable from './VeeamTable';

const VEEAMVERSION11 = 'Veeam 11';
const VEEAMVERSION12 = 'Veeam 12';

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
  } = useForm<VeeamConfiguration>({
    mode: 'all',
    resolver: joiResolver(schema),
    defaultValues: {
      name: '',
      version: VEEAMVERSION12,
      capacity: '5', //TODO: The default value will be net capacity.
      capacityUnit: 'TB',
      enableImmutableBackup: true,
    },
  });
  const isVeeam12 = watch('version') === VEEAMVERSION12;
  const onSubmit = () => {
    //TODO: Create account
  };
  const formRef = useRef(null);
  const [openVeeamTable, setOpenVeeamTable] = useState(false);

  if (openVeeamTable) {
    return <VeeamTable />;
  }

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
              setOpenVeeamTable(true);
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
        ></FormGroup>
        <FormGroup
          id="name"
          label="Repository name"
          direction="vertical"
          required
          labelHelpTooltip="TODO"
          error={errors.name?.message ?? ''}
          content={
            <Input
              id="name"
              type="text"
              autoComplete="off"
              placeholder="Veeam-repository name"
              {...register('name')}
            />
          }
        ></FormGroup>
        <FormGroup
          id="enableImmutableBackup"
          label="Immutable backup"
          direction="vertical"
          help="Enables permanent, unchangeable backups of objects in bucket."
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
        ></FormGroup>
        {isVeeam12 ? (
          <FormGroup
            id="capacity"
            label="Repository capacity"
            direction="vertical"
            error={errors.capacity?.message ?? ''}
            helpErrorPosition="bottom"
            labelHelpTooltip="TODO"
            content={
              <Stack direction="horizontal">
                <Input
                  id="capacity"
                  type="number"
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
                        <Select.Option value={'GB'}>GB</Select.Option>
                        <Select.Option value={'TB'}>TB</Select.Option>
                        <Select.Option value={'PB'}>PB</Select.Option>
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
