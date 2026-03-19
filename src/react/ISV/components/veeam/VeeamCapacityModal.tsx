import { joiResolver } from '@hookform/resolvers/joi';
import { Icon, Loader, Modal, Stack, ToastProvider, useToast, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { usePutObject } from '@scality/data-browser-library';
import Joi from 'joi';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { GET_CAPACITY_XML_CONTENT, VEEAM_OBJECT_KEY } from '../../constants';
import { checkDecimals } from '../../engine/validators';
import { getCapacityBytes, useCapacityUnit } from '../../hooks/useCapacityUnit';
import { VeeamCapacityFormSection } from './VeeamCapacityFormSection';

const schema = Joi.object({
  capacity: Joi.number()
    .required()
    .min(1)
    .max(1024)
    .custom((value, helpers) => {
      return checkDecimals(value, helpers);
    }),
  capacityUnit: Joi.string().required(),
});

type VeeamCapacityModalProps = {
  bucketName: string;
  maxCapacity: number;
  status: string;
  onCapacityUpdated?: (newCapacityBytes: number) => void;
};

type VeeamCapacityForm = {
  capacity: string;
  capacityUnit: string;
};

export const VeeamCapacityModalInternal = ({
  bucketName,
  maxCapacity,
  status,
  onCapacityUpdated,
}: VeeamCapacityModalProps) => {
  const { capacityValue, capacityUnit } = useCapacityUnit(maxCapacity);
  const methods = useForm<VeeamCapacityForm>({
    mode: 'all',
    resolver: joiResolver(schema),
    defaultValues: {
      capacity: capacityValue,
      capacityUnit,
    },
  });
  const {
    handleSubmit,
    formState: { isValid },
    watch,
    reset,
  } = methods;
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);

  useEffect(() => {
    reset({ capacity: capacityValue, capacityUnit });
  }, [capacityValue, capacityUnit, reset]);
  const { mutate } = usePutObject();
  const { showToast } = useToast();

  const onSubmit = ({ capacity, capacityUnit }: VeeamCapacityForm) => {
    const capacityBytes = getCapacityBytes(capacity, capacityUnit);
    mutate(
      {
        Bucket: bucketName,
        Key: VEEAM_OBJECT_KEY,
        Body: GET_CAPACITY_XML_CONTENT(capacityBytes),
        ContentType: 'text/xml',
      },
      {
        onSuccess: () => {
          setIsCapacityModalOpen(false);
          showToast({
            open: true,
            status: 'success',
            message: 'Repository capacity updated successfully',
          });
          onCapacityUpdated?.(Number(capacityBytes));
        },
        onError: (err) => {
          showToast({
            open: true,
            status: 'error',
            message: `Failed to update repository capacity: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        },
      },
    );
  };

  return (
    <FormProvider {...methods}>
      <>
        <Button
          type="button"
          variant="outline"
          label="Edit"
          aria-label="Edit max capacity"
          icon={status === 'loading' ? <Loader size="larger" /> : <Icon name="Pencil" />}
          onClick={() => setIsCapacityModalOpen(true)}
          disabled={status === 'loading'}
        />
        <Modal
          close={() => setIsCapacityModalOpen(false)}
          isOpen={isCapacityModalOpen}
          title="Edit max repository capacity"
          footer={
            <Wrap>
              <p></p>
              <Stack>
                <Button variant="outline" onClick={() => setIsCapacityModalOpen(false)} label="Cancel" />
                <Button
                  form="capacity-form"
                  type="submit"
                  variant="primary"
                  aria-label="Update max capacity"
                  onClick={handleSubmit(onSubmit)}
                  label="Confirm"
                  disabled={!isValid || (capacityValue === watch('capacity') && capacityUnit === watch('capacityUnit'))}
                />
              </Stack>
            </Wrap>
          }
        >
          <form
            id="capacity-form"
            onSubmit={handleSubmit(onSubmit)}
            style={{
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              width: '40rem',
            }}
          >
            <VeeamCapacityFormSection autoFocusEnabled={isCapacityModalOpen} />
          </form>
        </Modal>
      </>
    </FormProvider>
  );
};

export const VeeamCapacityModal = (props: VeeamCapacityModalProps) => {
  return (
    <ToastProvider>
      <VeeamCapacityModalInternal {...props} />
    </ToastProvider>
  );
};
