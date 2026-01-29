import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import React from 'react';
import { VeeamRepositoryFields } from '../VeeamRepositoryFields';
import { Wrapper } from '../../../utils/testUtil';
import { Form, FormSection, FormGroup } from '@scality/core-ui';

jest.mock('../../hooks/useIsVeeamVBROnly');

import { useIsVeeamVBROnly } from '../../hooks/useIsVeeamVBROnly';

const mockUseIsVeeamVBROnly = useIsVeeamVBROnly as jest.MockedFunction<
  typeof useIsVeeamVBROnly
>;

interface FormWrapperProps {
  children: React.ReactNode;
  defaultValues?: Record<string, unknown>;
}

const FormWrapper = ({ children, defaultValues }: FormWrapperProps) => {
  const methods = useForm({
    defaultValues: defaultValues || {
      autoCreateRepository: false,
      enableImmutableBackup: false,
      immutablePeriodDays: 1,
      accountNameType: 'create',
      IAMUserNameType: undefined,
    },
  });

  return (
    <FormProvider {...methods}>
      <Form
        layout={{
          kind: 'page',
          title: 'Test Form',
        }}
      >
        <FormSection>
          <FormGroup
            id="test-wrapper"
            label=""
            content={<div>{children}</div>}
          />
        </FormSection>
      </Form>
    </FormProvider>
  );
};

describe('VeeamRepositoryFields', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsVeeamVBROnly.mockReturnValue(true);
  });

  it('renders repository creation toggle', () => {
    render(
      <Wrapper>
        <FormWrapper
          defaultValues={{
            accountNameType: 'create',
          }}
        >
          <VeeamRepositoryFields />
        </FormWrapper>
      </Wrapper>,
    );

    expect(screen.getByText('Veeam repository creation')).toBeInTheDocument();
  });

  it('shows immutable period field when enabled', () => {
    render(
      <Wrapper>
        <FormWrapper
          defaultValues={{
            autoCreateRepository: true,
            enableImmutableBackup: true,
            immutablePeriodDays: 14,
            accountNameType: 'create',
          }}
        >
          <VeeamRepositoryFields />
        </FormWrapper>
      </Wrapper>,
    );

    expect(
      screen.getByText('Veeam Immutable retention period'),
    ).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(14);
  });
});
