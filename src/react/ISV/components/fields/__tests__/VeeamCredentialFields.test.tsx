import { Form, FormGroup, FormSection } from '@scality/core-ui';
import { fireEvent, render, screen } from '@testing-library/react';
import type React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { UseMutationResult } from 'react-query';
import { Wrapper } from '../../../../utils/testUtil';
import { useVeeamCredentialManagement } from '../../../contexts/VeeamCredentialContext';
import { VeeamCredentialFields } from '../VeeamCredentialFields';

jest.mock('../../../contexts/VeeamCredentialContext');
jest.mock('@scality/core-ui', () => ({
  ...jest.requireActual('@scality/core-ui'),
  useToast: jest.fn(() => ({ showToast: jest.fn() })),
}));

const mockUseVeeamCredentialManagement =
  useVeeamCredentialManagement as jest.MockedFunction<
    typeof useVeeamCredentialManagement
  >;

interface FormWrapperProps {
  children: React.ReactNode;
}

const FormWrapper = ({ children }: FormWrapperProps) => {
  const methods = useForm();

  return (
    <FormProvider {...methods}>
      <Form
        layout={{
          kind: 'page',
          title: 'Test Form',
        }}
      >
        <FormSection>
          <FormGroup id="test-wrapper" label="" content={<div>{children}</div>} />
        </FormSection>
      </Form>
    </FormProvider>
  );
};

describe('VeeamCredentialFields', () => {
  const mockMutate = jest.fn();
  const defaultMockValues = {
    isCredentialsValid: false,
    isCheckingCredentials: false,
    isCredentialCheckError: false,
    changeCredentialsMutation: {
      mutate: mockMutate,
      data: undefined,
      error: null,
      isError: false,
      isIdle: true,
      isLoading: false,
      isSuccess: false,
      status: 'idle' as const,
      reset: jest.fn(),
      mutateAsync: jest.fn(),
    } as unknown as UseMutationResult<unknown, unknown, { username: string; password: string }>,
    newCredentialsStatus: 'IDLE' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows warning when credentials are invalid', () => {
    mockUseVeeamCredentialManagement.mockReturnValue(defaultMockValues);

    render(
      <Wrapper>
        <FormWrapper>
          <VeeamCredentialFields />
        </FormWrapper>
      </Wrapper>,
    );

    expect(screen.getByText('Veeam Credentials required')).toBeInTheDocument();
    expect(
      screen.getByText(/To automatically create the repository/),
    ).toBeInTheDocument();
  });

  it('renders username and password input fields', () => {
    mockUseVeeamCredentialManagement.mockReturnValue(defaultMockValues);

    const { container } = render(
      <Wrapper>
        <FormWrapper>
          <VeeamCredentialFields />
        </FormWrapper>
      </Wrapper>,
    );

    expect(container.querySelector('#veeam-username')).toBeInTheDocument();
    expect(container.querySelector('#veeam-password')).toBeInTheDocument();
  });

  it('submits credentials when validate button is clicked', () => {
    mockUseVeeamCredentialManagement.mockReturnValue(defaultMockValues);

    const { container } = render(
      <Wrapper>
        <FormWrapper>
          <VeeamCredentialFields />
        </FormWrapper>
      </Wrapper>,
    );

    const usernameInput = container.querySelector('#veeam-username') as HTMLInputElement;
    const passwordInput = container.querySelector('#veeam-password') as HTMLInputElement;
    const submitButton = screen.getByRole('button', {
      name: /Update Veeam credentials/,
    });

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'testpass' } });
    fireEvent.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith(
      {
        username: 'testuser',
        password: 'testpass',
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
  });

  it('disables form during validation', () => {
    mockUseVeeamCredentialManagement.mockReturnValue({
      ...defaultMockValues,
      newCredentialsStatus: 'WAITING',
    });

    render(
      <Wrapper>
        <FormWrapper>
          <VeeamCredentialFields />
        </FormWrapper>
      </Wrapper>,
    );

    const inputs = screen.getAllByDisplayValue('');
    expect(inputs[0]).toBeDisabled();
    expect(inputs[1]).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /Update Veeam credentials/ }),
    ).toBeDisabled();
  });

  it('hides component when credentials are valid', () => {
    mockUseVeeamCredentialManagement.mockReturnValue({
      ...defaultMockValues,
      isCredentialsValid: true,
      newCredentialsStatus: 'IDLE',
    });

    render(
      <Wrapper>
        <FormWrapper>
          <VeeamCredentialFields />
        </FormWrapper>
      </Wrapper>,
    );

    expect(screen.queryByText('Veeam Credentials required')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Update Veeam credentials/ })).not.toBeInTheDocument();
  });

  it('disables submit button when fields are empty', () => {
    mockUseVeeamCredentialManagement.mockReturnValue(defaultMockValues);

    render(
      <Wrapper>
        <FormWrapper>
          <VeeamCredentialFields />
        </FormWrapper>
      </Wrapper>,
    );

    const submitButton = screen.getByRole('button', {
      name: /Update Veeam credentials/,
    });

    expect(submitButton).toBeDisabled();
  });
});
