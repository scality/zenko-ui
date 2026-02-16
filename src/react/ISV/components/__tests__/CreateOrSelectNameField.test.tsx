import { render, screen } from '@testing-library/react';
import { CreateOrSelectNameField } from '../CreateOrSelectNameField';
import { useFormContext } from 'react-hook-form';
import { useSearchParams } from 'react-router';

jest.mock('react-hook-form', () => {
  return {
    useFormContext: jest.fn(),
    Controller: ({ name, defaultValue, render }) => {
      if (name === 'accountNameType' || name === 'IAMUserNameType') {
        const { field } = render({
          field: {
            onChange: jest.fn(),
            value: defaultValue,
            name,
          },
        });
        return <div>{field}</div>;
      }

      return (
        <div>
          {
            render({
              field: {
                onChange: jest.fn(),
                value: defaultValue,
                name,
              },
            }).field
          }
        </div>
      );
    },
  };
});

jest.mock('react-router', () => ({
  useSearchParams: jest.fn(),
}));

jest.mock('@scality/core-ui', () => ({
  ...jest.requireActual('@scality/core-ui'),
  FormGroup: ({ id, label, content, error, children }) => (
    <div>
      <div>{label}</div>
      {content || children}
      {error && <div>{error}</div>}
    </div>
  ),
}));

jest.mock('@scality/core-ui/dist/next', () => {
  const SelectMock = ({
    children,
    onChange,
    value,
    id,
    disabled,
    placeholder,
  }) => {
    return (
      <div>
        <label htmlFor={id}>{placeholder}</label>
        <select
          id={id}
          aria-label={placeholder || id}
          role="combobox"
          onChange={(e) => onChange(e.target.value)}
          value={value}
          disabled={disabled}
        >
          {children}
        </select>
      </div>
    );
  };

  SelectMock.Option = ({ children }) => <option>{children}</option>;

  return {
    Input: (props) => (
      <input
        type="text"
        aria-label={props.placeholder || props.id || 'Input field'}
        role="textbox"
        {...props}
      />
    ),
    Select: SelectMock,
  };
});

describe('CreateOrSelectNameField', () => {
  const mockFormContext = {
    register: jest.fn().mockReturnValue({}),
    control: {},
    formState: { errors: {} },
  };

  const defaultProps = {
    isExist: false,
    status: 'success',
    options: [{ name: 'option1' }, { name: 'option2' }],
    platform: 'veeam',
    type: 'create' as const,
    fieldName: 'testField',
    label: 'Test Label',
    onFieldNameChange: jest.fn(),
    onOptionChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useFormContext as jest.Mock).mockReturnValue(mockFormContext);
    (useSearchParams as jest.Mock).mockReturnValue([
      { get: () => null },
      jest.fn(),
    ]);
  });

  const getRadioOptions = (
    isAccount = true,
    disableCreate = false,
    disableExisting = false,
  ) => {
    return [
      {
        value: 'create',
        label: `Create a new ${isAccount ? 'Account' : 'IAM User'}`,
        disabled: disableCreate,
      },
      {
        value: 'existing',
        label: `Use an existing ${isAccount ? 'Account' : 'IAM User'}`,
        disabled: disableExisting,
      },
    ];
  };

  it('renders in create mode with input field', () => {
    render(<CreateOrSelectNameField {...defaultProps} />);

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Account Name')).toBeInTheDocument();

    expect(screen.getByRole('textbox')).toBeInTheDocument();

    const radioOptions = getRadioOptions(true, false, false);
    expect(radioOptions).toHaveLength(2);
    expect(radioOptions[0].label).toBe('Create a new Account');
    expect(radioOptions[1].label).toBe('Use an existing Account');
  });

  it('renders in existing mode with select field', () => {
    render(<CreateOrSelectNameField {...defaultProps} type="existing" />);

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Account Name')).toBeInTheDocument();

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('renders loading state in select mode', () => {
    const props = {
      ...defaultProps,
      type: 'existing' as const,
      status: 'loading',
    };

    render(<CreateOrSelectNameField {...props} />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    expect(props.status).toBe('loading');
  });

  it('renders IAM user labels when isAccount is false', () => {
    render(
      <CreateOrSelectNameField {...defaultProps} onFieldNameChange={null} />,
    );

    expect(screen.getByText('IAM User Name')).toBeInTheDocument();

    const radioOptions = getRadioOptions(false, false, false);
    expect(radioOptions).toHaveLength(2);
    expect(radioOptions[0].label).toBe('Create a new IAM User');
    expect(radioOptions[1].label).toBe('Use an existing IAM User');
  });

  it('renders children when provided', () => {
    render(
      <CreateOrSelectNameField {...defaultProps}>
        <div aria-label="Child element">Child Content</div>
      </CreateOrSelectNameField>,
    );

    expect(screen.getByLabelText('Child element')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('displays form validation errors', () => {
    const formContextWithError = {
      ...mockFormContext,
      formState: {
        errors: {
          testField: { message: 'This field is required' },
        },
      },
    };
    (useFormContext as jest.Mock).mockReturnValue(formContextWithError);

    render(<CreateOrSelectNameField {...defaultProps} />);

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays already exists error when isExist is true and type is create', () => {
    render(<CreateOrSelectNameField {...defaultProps} isExist={true} />);

    expect(screen.getByText('Account name already exists')).toBeInTheDocument();
  });

  it('handles URL param matching with options', () => {
    (useSearchParams as jest.Mock).mockReturnValue([
      { get: () => 'option1' },
      jest.fn(),
    ]);

    render(<CreateOrSelectNameField {...defaultProps} isExist={true} />);

    const radioOptions = getRadioOptions(true, true, false);
    expect(radioOptions).toHaveLength(2);
    const createOption = radioOptions.find((opt) => opt.value === 'create');
    expect(createOption.disabled).toBe(true);
  });

  it('applies correct placeholder to input based on status and options', () => {
    const { rerender } = render(
      <CreateOrSelectNameField {...defaultProps} status="success" />,
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'veeam');

    rerender(<CreateOrSelectNameField {...defaultProps} status="loading" />);

    const loadingInput = screen.getByRole('textbox');
    expect(loadingInput).not.toHaveAttribute('placeholder', 'veeam');
  });

  it('updates UI when switching between create and existing modes', () => {
    const { rerender } = render(<CreateOrSelectNameField {...defaultProps} />);

    expect(screen.getByRole('textbox')).toBeInTheDocument();

    rerender(<CreateOrSelectNameField {...defaultProps} type="existing" />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
