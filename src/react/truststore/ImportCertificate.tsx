import {
  Dropzone,
  Form,
  Icon,
  Stack,
  Text,
  TextArea,
  useToast,
} from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import React, { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from '@hapi/joi';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useChainedMutations } from '@scality/react-chained-query';
import { useMutation } from 'react-query';

const CertificatePlaceholder = `Example: 
-----BEGIN CERTIFICATE-----
ARTESCA Certificate Authority
-----END CERTIFICATE-----`;

const ImportCertificate = () => {
  const navigate = useBasenameRelativeNavigate();
  const { showToast } = useToast();
  const [importCert, setImportCert] = useState<string | undefined>(undefined);
  const formMethods = useForm<{ certificate: string | undefined }>({
    mode: 'all',
    defaultValues: {
      certificate: undefined,
    },
    resolver: joiResolver(
      Joi.object({
        certificate: Joi.string().required(),
      }),
    ),
    shouldUnregister: false,
  });
  const { isValid } = formMethods.formState;
  const { setValue, handleSubmit } = formMethods;

  const createSecretWithCertificateMutation = useMutation({
    mutationFn: async (variables: { certificate: string }) => {
      console.log('DEBUG: Create Secret With Certificate', variables);
    },
    mutationKey: ['createSecretWithCertificate'],
  });

  const updateCRWithSecretMutation = useMutation({
    mutationFn: async (variables: { certificate: string }) => {
      console.log('DEBUG: Update CR With Secret', variables);
      return await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    mutationKey: ['updateCRWithSecret'],
  });

  const waitForZenkoConfigurationToBeUpdated = useMutation({
    mutationFn: async () => {
      console.log('DEBUG: Wait For Zenko Configuration To Be Updated');
      return await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    mutationKey: ['waitForZenkoConfigurationToBeUpdated'],
  });
  const mutations = [
    {
      ...createSecretWithCertificateMutation,
      key: 'createSecretWithCertificate',
    },
    {
      ...updateCRWithSecretMutation,
      key: 'updateCRWithSecret',
    },
    {
      ...waitForZenkoConfigurationToBeUpdated,
      key: 'waitForZenkoConfigurationToBeUpdated',
    },
  ];
  const isSuccess = useMemo(
    () => mutations.every((mutation) => mutation.isSuccess),
    [mutations],
  );
  const isLoading = useMemo(
    () => mutations.some((mutation) => mutation.isLoading),
    [mutations],
  );
  const isError = useMemo(
    () => mutations.some((mutation) => mutation.isError),
    [mutations],
  );

  const { mutate } = useChainedMutations({
    mutations,
    computeVariablesForNext: {
      createSecretWithCertificate: () => ({ certificate: importCert }),
      updateCRWithSecret: () => ({
        certificate: importCert,
      }),
    },
  });

  useEffect(() => {
    if (isError) {
      showToast({
        open: true,
        status: 'error',
        message: 'An error occurred while importing the certificate',
      });
    }
    if (isSuccess) {
      showToast({
        open: true,
        status: 'success',
        message: 'Certificate imported successfully',
      });
      navigate('/truststore');
    }
  }, [isError, isSuccess, showToast, navigate]);

  useEffect(() => {
    setValue('certificate', importCert, { shouldValidate: true });
  }, [importCert]);

  const onSubmit = () => {
    mutate();
  };

  return (
    <FormProvider {...formMethods}>
      <Form
        onSubmit={handleSubmit(onSubmit)}
        requireMode="all"
        layout={{ kind: 'page', title: 'Import a new Certificate' }}
        rightActions={
          <Stack gap="r16">
            <Button
              type="button"
              variant="outline"
              style={{ minWidth: '80px' }}
              onClick={() => {
                navigate('/truststore');
              }}
              label="Cancel"
            />
            <Button
              type="submit"
              variant="primary"
              label={isLoading ? 'Importing...' : 'Import'}
              disabled={!isValid}
              tooltip={{
                overlay: !isValid
                  ? 'Import a certificate before proceeding to the next step'
                  : isLoading
                  ? 'Importing certificate...'
                  : undefined,
              }}
              isLoading={isLoading}
            />
          </Stack>
        }
      >
        <Stack direction="vertical" gap="r16">
          <label htmlFor="Certificate">
            <Text isEmphazed>{`Certificate import`}</Text>
          </label>
          <Dropzone
            variant="large"
            labels={{
              label: 'Drag and drop file here',
              buttonLabel: 'Browse',
            }}
            multiple={false}
            onChange={(files: File[]) => {
              const reader = new FileReader();
              reader.onload = () => {
                setImportCert(reader.result as string);
              };
              if (files[0]) {
                reader.readAsText(files[0], 'utf-8');
              } else {
                setImportCert('');
              }
            }}
          />
          <TextArea
            id="Certificate"
            placeholder={CertificatePlaceholder}
            value={importCert}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setImportCert(e.currentTarget.value)
            }
            rows={10}
          />
        </Stack>
      </Form>
    </FormProvider>
  );
};

export default ImportCertificate;
