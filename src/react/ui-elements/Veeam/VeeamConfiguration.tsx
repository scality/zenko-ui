import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import {
  Form,
  FormGroup,
  FormSection,
  Icon,
  Stack,
  Text,
  Toggle,
} from '@scality/core-ui';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { Button, Input, Select } from '@scality/core-ui/dist/next';
import { useRef, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { useHistory } from 'react-router-dom';
import {
  XCORE_NOT_AVAILABLE,
  useXCoreLibrary,
} from '../../next-architecture/ui/XCoreLibraryProvider';
import {
  VeeamCapacityFormSection,
  VeeamCapacityFormWithXcore,
} from './VeeamCapacityFormSection';
import {
  VEEAM_BACKUP_REPLICATION,
  VEEAM_BACKUP_REPLICATION_XML_VALUE,
  VEEAM_DEFAULT_ACCOUNT_NAME,
  VEEAM_OFFICE_365,
  unitChoices,
} from './VeeamConstants';
import { VeeamSkipModal } from './VeeamSkipModal';
import { VEEAM_STEPS, VeeamStepsIndexes } from './VeeamSteps';
import { ListItem } from './VeeamTable';
import { getCapacityBytes } from './useCapacityUnit';
import { bucketNameValidationSchema } from '../../databrowser/buckets/BucketCreate';

const schema = Joi.object({
  bucketName: bucketNameValidationSchema,
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

const VeeamApplicationTooltip = () => (
  <>
    Choose the Veeam application you're setting up.
    <br />
    <br />
    Features such as Immutable Backup and Max Repository Capacity (that provides
    notification via Smart Object Storage API) are only supported in Veeam
    Backup and Replication, and not in Veeam Backup for Microsoft 365.
  </>
);

const VeeamBucketTooltip = () => (
  <ul>
    <ListItem>
      This bucket is your future Veeam destination. You'll need it when setting
      up your Veeam application. We'll also include this in the summary provided
      by our Veeam assistant at the end.
    </ListItem>
    <ListItem>
      The bucket name should follow few constraints:
      <ul>
        <li>Must be unique,</li>
        <li>Cannot be modified after creation</li>
        <li>
          Bucket names can include only lowercase letters, numbers, dots (.),
          and hyphens (-).
        </li>
      </ul>
    </ListItem>
  </ul>
);

const VeeamImmutableBackupTooltip = () => (
  <ul>
    <ListItem>
      Veeam's Immutable Backup feature enhances data protection by using S3
      Object-lock technology.
    </ListItem>
    <ListItem>
      By selecting the Immutable Backup feature, the ARTESCA bucket is created
      with Object-lock enabled.
    </ListItem>
    <ListItem>
      Data backed up to your ARTESCA S3 bucket via Veeam will be immutable.
    </ListItem>
  </ul>
);

const Configuration = () => {
  const methods = useForm<VeeamConfiguration>({
    mode: 'all',
    resolver: joiResolver(schema),
    defaultValues: {
      bucketName: '',
      application: VEEAM_BACKUP_REPLICATION_XML_VALUE,
      capacity: '0',
      capacityUnit: unitChoices.TiB.toString(),
      enableImmutableBackup: true,
    },
  });

  const {
    handleSubmit,
    control,
    register,
    watch,
    formState: { errors, isValid },
  } = methods;

  const history = useHistory();
  const { next } = useStepper(VeeamStepsIndexes.Configuration, VEEAM_STEPS);
  const application = watch('application');
  const onSubmit = ({
    capacity,
    capacityUnit,
    bucketName,
    application,
    enableImmutableBackup,
  }: VeeamConfiguration) => {
    next({
      bucketName,
      application,
      capacityBytes: getCapacityBytes(capacity, capacityUnit),
      enableImmutableBackup:
        application === VEEAM_BACKUP_REPLICATION_XML_VALUE
          ? enableImmutableBackup
          : false,
      // Add advanced configuration to set the account name, for the moment we use the default account name.
      accountName: VEEAM_DEFAULT_ACCOUNT_NAME,
    });
  };

  // clear server errors if clicked on outside of element.
  const formRef = useRef(null);
  const xCoreLibrary = useXCoreLibrary();
  const { useClusterCapacity } =
    xCoreLibrary === XCORE_NOT_AVAILABLE ? () => ({}) : xCoreLibrary;
  const [skip, setSkip] = useState<boolean>(false);

  return (
    <FormProvider {...methods}>
      <VeeamSkipModal
        isOpen={skip}
        close={() => setSkip(false)}
        exitAction={() => history.push('/accounts')}
        modalContent={
          <Text>
            Are you sure to skip this config? You’ll be able to go through this
            flow again (in the Account page if no Account has been created,
            otherwise on an Account edition page)
          </Text>
        }
      />
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
                setSkip(true);
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
        <FormSection forceLabelWidth={300}>
          <FormGroup
            id="application"
            label="Veeam application"
            labelHelpTooltip={<VeeamApplicationTooltip />}
            helpErrorPosition="bottom"
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
            required
            labelHelpTooltip={<VeeamBucketTooltip />}
            error={errors.bucketName?.message ?? ''}
            helpErrorPosition="bottom"
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
          {application === VEEAM_BACKUP_REPLICATION_XML_VALUE ? (
            <FormGroup
              id="enableImmutableBackup"
              label="Immutable backup"
              help="It enables object-lock on the bucket which means backups will be permanent and unchangeable."
              helpErrorPosition="bottom"
              labelHelpTooltip={<VeeamImmutableBackupTooltip />}
              content={
                <Controller
                  name="enableImmutableBackup"
                  control={control}
                  render={({ field: { value, onChange } }) => {
                    return (
                      <Toggle
                        id="enableImmutableBackup"
                        aria-label="enableImmutableBackup"
                        name="enableImmutableBackup"
                        toggle={value}
                        label={value ? 'Enabled' : 'Disabled'}
                        onChange={onChange}
                      />
                    );
                  }}
                />
              }
            />
          ) : (
            <></>
          )}
          {application === VEEAM_BACKUP_REPLICATION_XML_VALUE ? (
            useClusterCapacity ? (
              <VeeamCapacityFormWithXcore
                useClusterCapacity={useClusterCapacity}
              />
            ) : (
              <VeeamCapacityFormSection />
            )
          ) : (
            <></>
          )}
        </FormSection>
      </Form>
    </FormProvider>
  );
};

export default Configuration;
