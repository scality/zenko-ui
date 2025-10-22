import { Dropzone, Form, Icon, Stack, Text, TextArea } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import React, { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useStepper } from '@scality/core-ui/dist/components/steppers/Stepper.component';
import { CertificateStepsIndexes, CertificateData } from './CertificateSteps';
import { joiResolver } from '@hookform/resolvers/joi';
import Joi from '@hapi/joi';
import { useBasenameRelativeNavigate } from '@scality/module-federation';

const CertificatePlaceholder = `Example: 
-----BEGIN CERTIFICATE-----
ARTESCA Certificate Authority
-----END CERTIFICATE-----`;

const ImportCertificate = () => {
  const navigate = useBasenameRelativeNavigate();
  const { next } = useStepper(CertificateStepsIndexes.ImportCertificate);
  const formMethods = useForm<CertificateData>({
    mode: 'all',
    defaultValues: {
      certificate: '',
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

  const [importCert, setImportCert] = useState<string | undefined>(undefined);

  useEffect(() => {
    setValue('certificate', importCert, { shouldValidate: true });
  }, [importCert]);

  const onSubmit = (data: CertificateData) => {
    next(data);
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
              label="Continue"
              disabled={!isValid}
              tooltip={{
                overlay: !isValid
                  ? 'Import a certificate before proceeding to the next step'
                  : undefined,
              }}
              icon={<Icon name="Arrow-right" />}
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
            rows={20}
          />
        </Stack>
      </Form>
    </FormProvider>
  );
};

export default ImportCertificate;
