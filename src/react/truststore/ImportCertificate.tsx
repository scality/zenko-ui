import { isValidTrustedCACertificate } from '@scality/certchain';
import {
  Dropzone,
  Form,
  Stack,
  Text,
  TextArea,
  useToast,
} from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useMemo } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useQuery } from 'react-query';
import { useAddCertificateToZenkoConfigurationMutation } from '../../js/mutations';
import { getZenkoCRQuery } from '../queries';

const CertificatePlaceholder = `Example: 
-----BEGIN CERTIFICATE-----
intermediate1
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
CA
-----END CERTIFICATE-----`;

const ImportCertificate = () => {
  const navigate = useBasenameRelativeNavigate();
  const { showToast } = useToast();

  const formMethods = useForm<{ certificate: string | undefined }>({
    mode: 'all',
    defaultValues: {
      certificate: undefined,
    },
    shouldUnregister: false,
  });
  const {
    setValue,
    handleSubmit,
    register,
    formState: { isValid, errors },
  } = formMethods;

  const { data: zenkoCR, isLoading: isLoadingZenkoCR } = useQuery(
    getZenkoCRQuery(),
  );

  const hasEgress = useMemo(() => {
    return !!zenkoCR?.spec?.egress;
  }, [zenkoCR]);

  const hasExtraCACerts = useMemo(
    () => !!zenkoCR?.spec?.egress?.extraCACerts,
    [zenkoCR],
  );

  const addCertificateToZenkoConfigurationMutation =
    useAddCertificateToZenkoConfigurationMutation({
      hasEgress,
      hasExtraCACerts,
    });

  const onSubmit = (data: { certificate: string }) => {
    addCertificateToZenkoConfigurationMutation.mutate(
      {
        certificate: data.certificate,
      },
      {
        onSuccess: () => {
          showToast({
            open: true,
            message: 'Certificate imported successfully',
            status: 'success',
          });
          navigate('/truststore');
        },
        onError: () => {
          showToast({
            message: 'Failed to import certificate',
            status: 'error',
            open: true,
          });
        },
      },
    );
  };

  const isImportingCertificate = useMemo(() => {
    return addCertificateToZenkoConfigurationMutation.isLoading;
  }, [addCertificateToZenkoConfigurationMutation.isLoading]);

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
              label={
                isImportingCertificate
                  ? 'Importing certificate...'
                  : 'Import certificate'
              }
              disabled={!isValid}
              tooltip={{
                overlay: !isValid
                  ? 'Import a valid certificate'
                  : isImportingCertificate
                  ? 'Importing certificate...'
                  : undefined,
              }}
              isLoading={isImportingCertificate || isLoadingZenkoCR}
            />
          </Stack>
        }
      >
        <Stack direction="vertical" gap="r16">
          <Stack direction="vertical" gap="r8">
            <Text>
              Choose a file or paste the Certificate chain bundle in order to
              import a certificate.
            </Text>
            <Text>
              The certificate chain bundle should be PEM x509 formatted and
              follow this order: <br /> optional intermediate(s) then the root
              certificate.
            </Text>
            <Text>
              This action will update the ARTESCA configuration to add the
              certificate to the truststore. This operation may take some time.
            </Text>
          </Stack>
          <Stack direction="vertical" gap="r8">
            <Dropzone
              variant="inline"
              labels={{
                label: 'Drag and drop file here or',
                buttonLabel: 'Browse',
              }}
              multiple={false}
              onChange={(files: File[]) => {
                const reader = new FileReader();
                reader.onload = () => {
                  setValue('certificate', reader.result as string, {
                    shouldValidate: true,
                  });
                };
                reader.onerror = () => {
                  setValue('certificate', undefined, {
                    shouldValidate: true,
                  });
                  showToast({
                    message:
                      'Failed to read certificate file. Import a valid certificate PEM file',
                    status: 'error',
                    open: true,
                  });
                };
                if (files[0]) {
                  reader.readAsText(files[0], 'utf-8');
                } else {
                  setValue('certificate', undefined, {
                    shouldValidate: true,
                  });
                }
              }}
            />

            <TextArea
              {...register('certificate', {
                required: 'Certificate is required',
                validate: async (value) => {
                  if (!value) return true;
                  const isValid = await isValidTrustedCACertificate(value);
                  return isValid
                    ? true
                    : 'Invalid certificate. The certificate should be a valid PEM x509 file';
                },
              })}
              id="Certificate"
              placeholder={CertificatePlaceholder}
              rows={15}
            />
            <Text isEmphazed variant="Smaller" color="statusCritical">
              {errors.certificate?.message}
            </Text>
          </Stack>
        </Stack>
      </Form>
    </FormProvider>
  );
};

export default ImportCertificate;
