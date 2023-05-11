import { FormEvent, MouseEvent, useRef, useState } from 'react';
import { Form, FormGroup, FormSection, Icon, Stack } from '@scality/core-ui';
import { Box, Button, CopyButton } from '@scality/core-ui/dist/next';
import { Controller, Control } from 'react-hook-form';
import Editor from '../ui-elements/Editor';
import { Monaco } from '@monaco-editor/react';
import policySchema from '../../../policyJsonSchema.json';

export const CommonPolicyLayout = ({
  onSubmit,
  policyArn,
  policyNameField,
  isReadOnly,
  control,
  policyDocument,
  errors,
  isDirty,
  isValid,
  handleCancel,
}: {
  policyArn?: string;
  policyNameField: JSX.Element;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isReadOnly?: boolean;
  control: Control<{ policyDocument: string }>;
  policyDocument: string;
  errors?: {
    policyName?: { message?: string };
    policyDocument?: { message?: string };
  };
  isDirty: boolean;
  isValid: boolean;
  handleCancel: (e: MouseEvent<HTMLButtonElement>) => void;
}) => {
  const isCreateMode = !policyArn;

  const [editorYPosition, setEditorYPosition] = useState<number>(0);
  const [formBodyHeight, setFormBodyHeight] = useState<number>(0);
  const [formBodyYPosition, setFormBodyYPosition] = useState<number>(0);

  const editorContainerRef = (element: HTMLDivElement) => {
    setEditorYPosition(element?.getBoundingClientRect().y);
  };
  const formRef = (element: HTMLFormElement) => {
    setFormBodyYPosition(element?.children[1].getBoundingClientRect().y);
    setFormBodyHeight(element?.children[1].getBoundingClientRect().height);
  };

  const editorHeight =
    formBodyHeight - (editorYPosition - formBodyYPosition) - 46;

  return (
    <Form
      ref={formRef}
      onSubmit={onSubmit}
      layout={{
        kind: 'page',
        title: `Policy ${
          isCreateMode ? 'Creation' : !isReadOnly ? 'Edition' : ''
        }`,
      }}
      requireMode={isCreateMode ? 'partial' : 'all'}
      rightActions={
        isReadOnly ? (
          <Button
            variant="outline"
            label="Close"
            onClick={handleCancel}
            type="button"
          />
        ) : (
          <Stack gap="r16">
            <Button
              variant="outline"
              label="Cancel"
              onClick={handleCancel}
              type="button"
            />
            <Button
              disabled={!isDirty || !isValid}
              type="submit"
              id="create-account-btn"
              variant="primary"
              icon={!isCreateMode ? <Icon name="Save" /> : undefined}
              label={isCreateMode ? 'Create' : 'Save'}
            />
          </Stack>
        )
      }
    >
      <FormSection>
        <FormGroup
          id="policyName"
          label="Policy Name"
          required
          helpErrorPosition={isCreateMode ? 'bottom' : 'right'}
          direction={isCreateMode ? 'vertical' : 'horizontal'}
          error={errors?.policyName?.message}
          content={policyNameField}
        />
        {policyArn ? (
          <FormGroup
            id="policyARN"
            label="Policy ARN"
            required
            content={
              <>
                <span>{policyArn}</span>
                <CopyButton textToCopy={policyArn} />
              </>
            }
          />
        ) : (
          <></>
        )}
        <FormGroup
          id="policyDocument"
          label="Policy Document"
          required
          direction="vertical"
          error={errors?.policyDocument?.message}
          help="We are supporting AWS IAM standards."
          helpErrorPosition="bottom"
          content={
            <div ref={editorContainerRef}>
              <Stack>
                <Controller
                  control={control}
                  name="policyDocument"
                  rules={{
                    required: 'The policy document is required',
                  }}
                  render={({ field: { onChange, value } }) => (
                    <Editor
                      language="application/json"
                      width="33rem"
                      height={`${editorHeight}px`}
                      onChange={onChange}
                      value={value}
                      readOnly={isReadOnly}
                      beforeMount={(monaco: Monaco) => {
                        monaco.languages.json.jsonDefaults.setDiagnosticsOptions(
                          {
                            validate: true,
                            schemas: [
                              {
                                uri: 'http://myserver/foo-schema.json', // id of the first schema
                                fileMatch: ['*'],
                                schema: policySchema,
                              },
                            ],
                          },
                        );
                      }}
                    />
                  )}
                />
                <Box alignSelf="baseline">
                  <CopyButton
                    textToCopy={policyDocument}
                    label="Policy"
                    variant="outline"
                  />
                </Box>
              </Stack>
            </div>
          }
        />
      </FormSection>
    </Form>
  );
};
