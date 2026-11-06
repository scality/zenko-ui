import { Icon, Stack, spacing } from '@scality/core-ui';
import { Button, CopyButton, Editor } from '@scality/core-ui/dist/next';
import type { JSONSchema7 } from 'json-schema';
import { type JSX, type MouseEvent, type SubmitEvent, useState } from 'react';
import { type Control, Controller } from 'react-hook-form';
import styled from 'styled-components';
import policySchema from '../../../policyJsonSchema.json';
import { Form, FormGroup, FormSection } from '../ui-elements/CoreUIForm';
import { EDITOR_ASIDE_STACK_AT, FIELD_CONTENT_STRETCH } from '../ui-elements/responsive';

const EditorRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${spacing.r16};
  min-width: 0;
  width: 100%;

  @container responsive (max-width: ${EDITOR_ASIDE_STACK_AT}px) {
    flex-direction: column;
  }
`;

const EditorPane = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
`;

const EditorAside = styled.div`
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${spacing.r8};
`;

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
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
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

  const editorHeight = formBodyHeight - (editorYPosition - formBodyYPosition) - 46;

  return (
    <Form
      ref={formRef}
      onSubmit={onSubmit}
      layout={{
        kind: 'page',
        title: `Policy ${isCreateMode ? 'Creation' : !isReadOnly ? 'Edition' : ''}`,
      }}
      requireMode={isCreateMode ? 'partial' : 'all'}
      rightActions={
        isReadOnly ? (
          <Button variant="outline" label="Close" onClick={handleCancel} type="button" />
        ) : (
          <Stack gap="r16">
            <Button variant="outline" label="Cancel" onClick={handleCancel} type="button" />
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
      responsive
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
        ) : null}
        <FormGroup
          id="policyDocument"
          label="Policy Document"
          required
          direction="vertical"
          error={errors?.policyDocument?.message}
          help="We are supporting AWS IAM standards."
          helpErrorPosition="bottom"
          content={
            <div ref={editorContainerRef} style={FIELD_CONTENT_STRETCH}>
              <EditorRow>
                <EditorPane>
                  <Controller
                    control={control}
                    name="policyDocument"
                    rules={{
                      required: 'The policy document is required',
                    }}
                    render={({ field: { onChange, value } }) => (
                      <Editor
                        language={{ name: 'json', schema: policySchema as unknown as JSONSchema7 }}
                        height={`${editorHeight}px`}
                        onChange={onChange}
                        value={value}
                        readOnly={isReadOnly}
                      />
                    )}
                  />
                </EditorPane>
                <EditorAside>
                  <CopyButton textToCopy={policyDocument} label="Policy" variant="outline" />
                </EditorAside>
              </EditorRow>
            </div>
          }
        />
      </FormSection>
    </Form>
  );
};
