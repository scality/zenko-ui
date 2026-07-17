import { Dropzone, Stack, Text, TextArea } from '@scality/core-ui';
import type { ChangeEvent } from 'react';
import { useFormContext } from 'react-hook-form';
import styled from 'styled-components';

const ErrorText = styled.span`
  color: ${(props) => props.theme.statusCritical};
  font-size: 0.75rem;
`;

const CertificateContainer = styled.div`
  background-color: ${(props) => props.theme.backgroundLevel2};
  border-radius: 3px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: ${(props) => props.theme.textPrimary};
  max-width: 45rem;
`;

const PLACEHOLDER = `Example:
-----BEGIN CERTIFICATE-----
CA
-----END CERTIFICATE-----`;

type Props = {
  /** RHF field name bound to the PEM value. */
  name: string;
  /** Drop the required marker (`*`) — set to true when editing an existing entity. */
  isEdit?: boolean;
};

/**
 * Self-contained PEM certificate import — label + drag-and-drop OR paste.
 * Must be rendered inside a `<FormProvider>`; renders as a direct section
 * child, not inside a FormGroup.
 */
export const CertificateSection = ({ name, isEdit }: Props) => {
  const {
    register,
    setValue,
    watch,
    formState: { errors, touchedFields },
  } = useFormContext();
  const value = watch(name) ?? '';
  const registered = register(name);
  const errorMessage = touchedFields[name] ? (errors[name]?.message as string | undefined) : undefined;

  const readFile = (files: File[]) => {
    if (!files[0]) {
      setValue(name, '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setValue(name, reader.result as string, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    };
    reader.onerror = () => {
      setValue(name, '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
    };
    reader.readAsText(files[0], 'utf-8');
  };

  return (
    <CertificateContainer>
      <label htmlFor={name}>
        <Text isEmphazed>{`Certificate import ${isEdit ? '' : '*'}`.trim()}</Text>
      </label>
      <Stack direction="vertical" style={{ gap: '0px' }}>
        <Dropzone
          variant="inline"
          labels={{ label: 'Drag and drop file here OR', buttonLabel: 'Browse' }}
          multiple={false}
          onChange={readFile}
        />
        <TextArea
          id={name}
          placeholder={PLACEHOLDER}
          rows={10}
          {...registered}
          value={value}
          onChange={(event: ChangeEvent<HTMLTextAreaElement>) => {
            registered.onChange(event);
          }}
        />
      </Stack>
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
    </CertificateContainer>
  );
};
