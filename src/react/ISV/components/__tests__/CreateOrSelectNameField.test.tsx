import { render, screen } from '@testing-library/react';
import { useFormContext } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { CreateOrSelectNameField } from '../CreateOrSelectNameField';

jest.mock('react-hook-form', () => {
  return {
    useFormContext: jest.fn(),
    Controller: ({ name, defaultValue, render }) => (
      <div>
        {render({
          field: { onChange: jest.fn(), value: defaultValue, name },
        })}
      </div>
    ),
  };
});

jest.mock('react-router', () => ({
  useSearchParams: jest.fn(),
}));

jest.mock('@scality/core-ui', () => ({
  ...jest.requireActual('@scality/core-ui'),
  FormGroup: ({ label, content, error }) => (
    <div>
      <div>{label}</div>
      {content}
      {error && <div>{error}</div>}
    </div>
  ),
  Tooltip: ({ children, overlay }) => (
    <>
      {children}
      {overlay}
    </>
  ),
}));

jest.mock('@scality/core-ui/dist/next', () => {
  const SelectMock = ({ children, onChange, value, id, disabled, placeholder }) => (
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
  SelectMock.Option = ({ children }) => <option>{children}</option>;

  return {
    Input: (props) => (
      <input type="text" aria-label={props.placeholder || props.id || 'Input field'} role="textbox" {...props} />
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
    (useSearchParams as jest.Mock).mockReturnValue([{ get: () => null }, jest.fn()]);
  });

  it('renders the field label and a text input in create mode', () => {
    render(<CreateOrSelectNameField {...defaultProps} />);

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Account Name')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders Account radio options when managing an account', () => {
    render(<CreateOrSelectNameField {...defaultProps} />);

    expect(screen.getByRole('radio', { name: 'Create a new Account' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Use an existing Account' })).toBeInTheDocument();
  });

  it('renders a select dropdown in existing mode instead of a text input', () => {
    render(<CreateOrSelectNameField {...defaultProps} type="existing" />);

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders IAM User labels and radio options when managing an IAM user', () => {
    render(<CreateOrSelectNameField {...defaultProps} onFieldNameChange={null} />);

    expect(screen.getByText('IAM User Name')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Create a new IAM User' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Use an existing IAM User' })).toBeInTheDocument();
  });

  it('renders children inside the field', () => {
    render(
      <CreateOrSelectNameField {...defaultProps}>
        <div aria-label="Child element">Child Content</div>
      </CreateOrSelectNameField>,
    );

    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('shows a validation error message when the form has an error', () => {
    (useFormContext as jest.Mock).mockReturnValue({
      ...mockFormContext,
      formState: { errors: { testField: { message: 'This field is required' } } },
    });

    render(<CreateOrSelectNameField {...defaultProps} />);

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('shows an "already exists" error injected via form errors', () => {
    (useFormContext as jest.Mock).mockReturnValue({
      ...mockFormContext,
      formState: { errors: { testField: { message: 'Account name already exists' } } },
    });

    render(<CreateOrSelectNameField {...defaultProps} />);

    expect(screen.getByText('Account name already exists')).toBeInTheDocument();
  });

  it('uses the platform name as placeholder when status is success and options exist', () => {
    render(<CreateOrSelectNameField {...defaultProps} status="success" />);

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'veeam');
  });

  it('shows a text input when switching back to create mode', () => {
    const { rerender } = render(<CreateOrSelectNameField {...defaultProps} type="existing" />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    rerender(<CreateOrSelectNameField {...defaultProps} type="create" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows the reason why "Use an existing" is disabled when no matching IAM user exists', () => {
    render(
      <CreateOrSelectNameField
        {...defaultProps}
        onFieldNameChange={null}
        options={[]}
        disabledExistingReason="No matching IAM User found"
      />,
    );

    expect(screen.getByText('No matching IAM User found')).toBeInTheDocument();
  });

  it('shows no extra explanation when disabledExistingReason is not provided', () => {
    render(
      <CreateOrSelectNameField
        {...defaultProps}
        onFieldNameChange={null}
        options={[]}
      />,
    );

    expect(screen.queryByText('No matching IAM User found')).not.toBeInTheDocument();
  });
});
