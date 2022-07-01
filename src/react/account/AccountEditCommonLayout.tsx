import { FormEvent } from 'react';
import FormContainer, * as F from '../ui-elements/FormLayout';
import { SecondaryText } from '@scality/core-ui';
import { Box, Button } from '@scality/core-ui/dist/next';
import { Controller, Control } from 'react-hook-form';
import CopyButton from '../ui-elements/CopyButton';
import { Clipboard } from '../ui-elements/Clipboard';
import Editor from '../ui-elements/Editor';
import styled from 'styled-components';
import { Monaco } from '@monaco-editor/react';
import policySchema from '../../../policyJsonSchema.json';

const FooterWrapper = styled.div`
  position: fixed;
  bottom: 1rem;
`;

const StyledFooter = styled(F.Footer)`
  flex-direction: column;
`;

const StyledBox = styled.div`
  display: flex;
  flex-direction: row;
`;

const FittingHr = styled(F.Hr)`
  width: 100%;
`;

const StyledLabel = styled(F.Label)`
  min-width: 9.22rem;
  width: 9.22rem;
`;

const StyledFieldSet = styled(F.Fieldset)`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
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
  handleCancel,
}: {
  policyArn?: string;
  policyNameField: JSX.Element;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isReadOnly?: boolean;
  control: Control<{ policyDocument: string }>;
  policyDocument: string;
  errors?: { policyDocument?: { message?: string } };
  isDirty: boolean;
  handleCancel: (e: MouseEvent) => void;
}) => {
  const isCreateMode = !policyArn;
  return (
    <FormContainer>
      <F.Form onSubmit={onSubmit}>
        <F.Title>
          Policy {isCreateMode ? 'Creation' : !isReadOnly ? 'Edition' : ''}
        </F.Title>
        <FittingHr />
        {isCreateMode && (
          <SecondaryText> All * are mandatory fields </SecondaryText>
        )}
        <StyledFieldSet>
          <StyledLabel htmlFor="policyName" data-testid="policyNameLabel">
            Policy Name{isCreateMode && <>*</>}
          </StyledLabel>
          {policyNameField}
        </StyledFieldSet>
        {policyArn && (
          <StyledFieldSet>
            <StyledLabel htmlFor="policyARN" data-testid="policyARNLabel">
              Policy ARN
            </StyledLabel>
            <span>{policyArn}</span>
            <Clipboard text={policyArn} />
          </StyledFieldSet>
        )}
        <F.Fieldset>
          <F.Label htmlFor="policyDocument">
            Policy Document{isCreateMode && <>*</>}
          </F.Label>
          <StyledBox>
            <Controller
              control={control}
              name="policyDocument"
              rules={{
                required: 'The policy document is required',
              }}
              render={({ field: { onChange, value } }) => (
                <Editor
                  data-testid="policyDocumentInput"
                  language="application/json"
                  width="33rem"
                  height="10.5rem"
                  onChange={onChange}
                  value={value}
                  readOnly={isReadOnly}
                  beforeMount={(monaco: Monaco) => {
                    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
                      validate: true,
                      schemas: [
                        {
                          uri: 'http://myserver/foo-schema.json', // id of the first schema
                          fileMatch: ['*'],
                          schema: policySchema,
                        },
                      ],
                    });
                  }}
                />
              )}
            />
            <CopyButton
              text={policyDocument}
              labelName={'Text'}
              style={{ marginLeft: '1rem' }}
            />
          </StyledBox>
        </F.Fieldset>
        <Box mt="1rem" mb="1rem">
          <SecondaryText style={{ fontStyle: 'italic' }}>
            We are supporting AWS IAM standards.
          </SecondaryText>
        </Box>
        <F.ErrorInput
          id="error-name"
          hasError={!!errors?.policyDocument}
          style={{ height: 'initial' }}
        >
          <> {errors?.policyDocument?.message} </>
        </F.ErrorInput>
        <FooterWrapper>
          <StyledFooter>
            <F.Hr />
            {isReadOnly && (
              <F.FooterButtons>
                <Button
                  variant="outline"
                  label="Close"
                  onClick={handleCancel}
                />
              </F.FooterButtons>
            )}
            {!isReadOnly && (
              <F.FooterButtons>
                <Button
                  variant="outline"
                  label="Cancel"
                  onClick={handleCancel}
                />
                <Button
                  disabled={!isDirty}
                  type="submit"
                  id="create-account-btn"
                  variant="primary"
                  icon={
                    !isCreateMode ? <i className="fas fa-save" /> : undefined
                  }
                  label={isCreateMode ? 'Create' : 'Save'}
                />
              </F.FooterButtons>
            )}
          </StyledFooter>
        </FooterWrapper>
      </F.Form>
    </FormContainer>
  );
};
