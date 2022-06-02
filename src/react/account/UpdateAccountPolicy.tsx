import React from 'react';
import FormContainer, * as F from '../ui-elements/FormLayout';
import { SecondaryText } from '@scality/core-ui';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery } from 'react-query';
import CopyButton from '../ui-elements/CopyButton';
import { useHistory, useParams } from 'react-router';
import { useIAMClient } from '../IAMProvider';
import { getPolicyQuery } from '../queries';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { Clipboard } from '../ui-elements/Clipboard';
import Editor from '../ui-elements/Editor';
import Loader from '../ui-elements/Loader';
import { useCurrentAccount } from '../DataServiceRoleProvider';
import styled from 'styled-components';
import { regexArn } from '../utils/hooks';

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
  align-items: flex-start;
`;

type FormValues = {
  policyName: string;
  policyDocument: string;
};

const UpdateAccountPolicy = () => {
  const IAMClient = useIAMClient();
  const history = useHistory();
  const { policyArn: encodedPolicyArn, DefaultVersionId } = useParams<{
    accountName: string;
    policyArn: string;
    DefaultVersionId: string;
  }>();

  const { account } = useCurrentAccount();
  const defaultValues = {
    policyName: '',
    policyDocument: '',
  };
  const {
    control,
    handleSubmit,
    watch,
    formState: { isDirty, errors },
    setValue,
    setError,
  } = useForm<FormValues>({
    defaultValues,
  });
  const watchAllFields = watch();
  const policyArn = decodeURIComponent(encodedPolicyArn);
  const policyName = regexArn.exec(policyArn)?.groups?.name;
  const { data: policyResult, status } = useQuery({
    ...getPolicyQuery(policyArn, DefaultVersionId, IAMClient),
    onSuccess: (data) => {
      const formattedDocument = JSON.stringify(
        JSON.parse(decodeURIComponent(data?.PolicyVersion?.Document ?? '')),
        null,
        2,
      );
      setValue('policyDocument', formattedDocument);
    },
  });

  const updatePolicyMutation = useMutation(
    ({ policyDocument }: { policyDocument: string }) => {
      return notFalsyTypeGuard(IAMClient).CreatePolicyVersion(
        policyArn,
        policyDocument,
      );
    },
    {
      onSuccess: () => history.push(`/accounts/${account?.Name}/policies`),
      onError: (error) =>
        setError('policyDocument', {
          type: 'custom',
          message: `Update policy error: ${error}`,
        }),
    },
  );

  const onSubmit = (data: FormValues) => {
    const policyDocument = data.policyDocument;
    updatePolicyMutation.mutate({ policyName, policyDocument });
  };

  const handleCancel = (e) => {
    if (e) {
      e.preventDefault();
    }
    history.push(`/accounts/${account?.Name}/policies`);
  };

  if (!policyResult && (status === 'idle' || status === 'loading')) {
    return (
      <Loader>
        <div>Loading...</div>
      </Loader>
    );
  }

  return (
    <FormContainer>
      <F.Form onSubmit={handleSubmit(onSubmit)}>
        <F.Title>Policy Edition</F.Title>
        <FittingHr />
        <StyledFieldSet>
          <StyledLabel
            htmlFor="policyName"
            data-testid="policyNameLabel"
            tooltipMessages={['The policy name is required']}
            tooltipWidth="10.5rem"
          >
            Policy Name
          </StyledLabel>
          <span>{policyName}</span>
        </StyledFieldSet>
        <StyledFieldSet>
          <StyledLabel
            htmlFor="policyARN"
            data-testid="policyARNLabel"
            tooltipMessages={['The policy ARN is required']}
            tooltipWidth="10.5rem"
          >
            Policy ARN
          </StyledLabel>
          <span>{policyArn}</span>
          <Clipboard text={policyArn} />
        </StyledFieldSet>
        <F.Fieldset>
          <F.Label htmlFor="policyDocument">Policy Document</F.Label>
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
                />
              )}
            />
            <CopyButton
              text={watchAllFields.policyDocument}
              labelName={'Text'}
              style={{ marginLeft: '6px' }}
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
          hasError={errors?.policyDocument}
          style={{ height: 'initial' }}
        >
          {' '}
          {errors?.policyDocument?.message}{' '}
        </F.ErrorInput>
        <FooterWrapper>
          <StyledFooter>
            <F.Hr />
            <F.FooterButtons>
              <Button variant="outline" label="Cancel" onClick={handleCancel} />
              <Button
                disabled={!isDirty}
                type="submit"
                id="create-account-btn"
                variant="primary"
                icon={<i className="fas fa-save" />}
                label="Save"
              />
            </F.FooterButtons>
          </StyledFooter>
        </FooterWrapper>
      </F.Form>
    </FormContainer>
  );
};

export default UpdateAccountPolicy;
