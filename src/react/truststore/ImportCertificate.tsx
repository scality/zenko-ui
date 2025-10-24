import {
  Dropzone,
  Form,
  InfoMessage,
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
import {
  useBasenameRelativeNavigate,
  useShellHooks,
} from '@scality/module-federation';
import { useQuery } from 'react-query';
import { useDeployedMetalk8sInstances } from '../next-architecture/ui/ConfigProvider';
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

  const { data: zenkoCR, isLoading: isLoadingZenkoCR } = useQuery(
    getZenkoCRQuery(),
  );

  const hasExtraCACerts = useMemo(
    () => !!zenkoCR?.spec?.egress?.extraCACerts,
    [zenkoCR],
  );

  const addCertificateToZenkoConfigurationMutation =
    useAddCertificateToZenkoConfigurationMutation(hasExtraCACerts);

  useEffect(() => {
    setValue('certificate', importCert, { shouldValidate: true });
  }, [importCert]);

  const onSubmit = () => {
    addCertificateToZenkoConfigurationMutation.mutate(
      {
        certificate: importCert,
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
              label={isImportingCertificate ? 'Importing...' : 'Import'}
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
          <InfoMessage
            title="Certificate import"
            content={
              <Text>
                Choose a file or paste the Certificate chain bundle in order to
                import a certificate.
                <br />
                The certificate chain bundle should be PEM x509 formatted and
                follow this order: optional intermediate(s) then the root
                certificate.
                <br />
                This action will update the ARTESCA configuration to add the
                certificate to the truststore. This operation may take some
                time.
              </Text>
            }
          />
          <Dropzone
            variant="inline"
            labels={{
              label: 'Drag and drop file here OR',
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
