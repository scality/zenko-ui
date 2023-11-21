import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import {
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
  Toggle,
} from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { Button, Input, Select } from '@scality/core-ui/dist/next';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { VEEAM_STEPS, VeeamStepsIndexes } from './VeeamSteps';
import { useXCoreLibrary } from '../../next-architecture/ui/XCoreLibraryProvider';
import { useXcoreConfig } from '../../next-architecture/ui/ConfigProvider';
import prettyBytes from 'pretty-bytes';
import {
  VEEAM_BACKUP_REPLICATION,
  VEEAM_BACKUP_REPLICATION_XML_VALUE,
  VEEAM_DEFAULT_ACCOUNT_NAME,
  VEEAM_OFFICE_365,
} from './VeeamConstants';

const schema = Joi.object({
  bucketName: Joi.string().required(),
  application: Joi.string().required(),
  capacity: Joi.when('application', {
    is: Joi.equal(VEEAM_BACKUP_REPLICATION),
    then: Joi.number().required().min(1).max(999),
    otherwise: Joi.valid(),
  }),
  capacityUnit: Joi.when('application', {
    is: Joi.equal(VEEAM_BACKUP_REPLICATION),
    then: Joi.string().required(),
    otherwise: Joi.valid(),
  }),
  enableImmutableBackup: Joi.boolean().required(),
});

type VeeamConfiguration = {
  bucketName: string;
  application: string;
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
      bucketName: '',
      application: VEEAM_BACKUP_REPLICATION_XML_VALUE,
      capacity: '5', //TODO: The default value will be net capacity.
      capacityUnit: 'TiB',
      enableImmutableBackup: true,
    },
  });

  const { next } = useStepper(VeeamStepsIndexes.Configuration, VEEAM_STEPS);
  const application = watch('application');
  const onSubmit = ({
    bucketName,
    application,
    capacity,
    capacityUnit,
    enableImmutableBackup,
  }: VeeamConfiguration) => {
    next({
      bucketName,
      application,
      capacity,
      capacityUnit,
      enableImmutableBackup,
      // Add advanced configuration to set the account name, for the moment we use the default account name.
      accountName: VEEAM_DEFAULT_ACCOUNT_NAME,
    });
  };

  // clear server errors if clicked on outside of element.
  const formRef = useRef(null);
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
      requireMode="partial"
      layout={{
        title: 'Prepare ARTESCA for Veeam',
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
            icon={<Icon name="Arrow-right" />}
          />
        </Stack>
      }
    >
      <FormSection>
        <FormGroup
          id="application"
          label="Veeam application"
          direction="vertical"
          labelHelpTooltip="TODO"
          content={
            <Controller
              name="application"
              control={control}
              render={({ field: { onChange, value } }) => {
                return (
                  <Select id="application" onChange={onChange} value={value}>
                    <Select.Option
                      key={VEEAM_BACKUP_REPLICATION_XML_VALUE}
                      value={VEEAM_BACKUP_REPLICATION_XML_VALUE}
                    >
                      {VEEAM_BACKUP_REPLICATION}
                    </Select.Option>
                    <Select.Option
                      key={VEEAM_OFFICE_365}
                      value={VEEAM_OFFICE_365}
                    >
                      {VEEAM_OFFICE_365}
                    </Select.Option>
                  </Select>
                );
              }}
            />
          }
        />
        <FormGroup
          id="bucketName"
          label="Bucket name"
          direction="vertical"
          required
          labelHelpTooltip="TODO"
          error={errors.bucketName?.message ?? ''}
          content={
            <Input
              id="bucketName"
              type="text"
              autoComplete="off"
              placeholder="Veeam bucket name"
              {...register('bucketName')}
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
            />
          }
        />
        {application === VEEAM_BACKUP_REPLICATION_XML_VALUE ? (
          <FormGroup
            id="capacity"
            label="Max Veeam Repository Capacity"
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
          />
        ) : (
          <></>
        )}
      </FormSection>
    </Form>
  );
};

export default Configuration;
