import Joi from '@hapi/joi';
import { joiResolver } from '@hookform/resolvers/joi';
import {
  Icon,
  Loader,
  Modal,
  Stack,
  ToastProvider,
  Wrap,
  useToast,
} from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { AWSError } from 'aws-sdk';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useQueryClient } from 'react-query';
import { usePutObjectMutation } from '../../../js/mutations';
import { VeeamCapacityFormSection } from './VeeamCapacityFormSection';
import {
  GET_CAPACITY_XML_CONTENT,
  VEEAM_OBJECT_KEY,
  VEEAM_XML_PREFIX,
} from './VeeamConstants';
import { getCapacityBytes, useCapacityUnit } from './useCapacityUnit';

const schema = Joi.object({
  capacity: Joi.number().required().min(1).max(999).integer(),
  capacityUnit: Joi.string().required(),
});

type VeeamCapacityModalProps = {
  bucketName: string;
  maxCapacity: number;
  status: string;
};

type VeeamCapacityForm = {
  capacity: string;
  capacityUnit: string;
};

export const VeeamCapacityModalInternal = ({
  bucketName,
  maxCapacity,
  status,
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
  } = methods;
  const [isCapacityModalOpen, setIsCapacityModalOpen] = useState(false);
  const { mutate } = usePutObjectMutation();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const onSubmit = ({ capacity, capacityUnit }: VeeamCapacityForm) => {
    mutate(
      {
        Bucket: bucketName,
        Key: `${VEEAM_XML_PREFIX}/capacity.xml`,
        Body: GET_CAPACITY_XML_CONTENT(
          getCapacityBytes(capacity, capacityUnit),
        ),
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
          queryClient.invalidateQueries([
            'getObjectQuery',
            bucketName,
            VEEAM_OBJECT_KEY,
          ]);
        },
        onError: (err) => {
          const error = err as AWSError;
          showToast({
            open: true,
            status: 'error',
            message: `Failed to update repository capacity: ${error.message}`,
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
          icon={
            status === 'loading' ? (
              <Loader size="larger" />
            ) : (
              <Icon name="Pencil" />
            )
          }
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
                <Button
                  variant="outline"
                  onClick={() => setIsCapacityModalOpen(false)}
                  label="Cancel"
                />
                <Button
                  form="capacity-form"
                  type="submit"
                  variant="primary"
                  aria-label="Update max capacity"
                  onClick={handleSubmit(onSubmit)}
                  label="Confirm"
                  disabled={
                    !isValid ||
                    (capacityValue === watch('capacity') &&
                      capacityUnit === watch('capacityUnit'))
                  }
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
