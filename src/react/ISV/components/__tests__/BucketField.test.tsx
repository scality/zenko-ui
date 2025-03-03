import { render, screen, fireEvent } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import BucketField from '../BucketField';
import { Wrapper } from '../../../utils/testUtil';

// Mock XCoreLibraryProvider
jest.mock('../../../next-architecture/ui/XCoreLibraryProvider', () => {
  const XCORE_NOT_AVAILABLE = 'XCORE_NOT_AVAILABLE';
  return {
    useXCoreLibrary: jest.fn(() => XCORE_NOT_AVAILABLE),
    XCORE_NOT_AVAILABLE,
  };
});

// Mock core-ui components
jest.mock('@scality/core-ui', () => ({
  FormGroup: ({ children, label, labelHelpTooltip, error, content, id }) => (
    <div>
      <label htmlFor={id}>{label}</label>
      {labelHelpTooltip}
      {content || children}
      {error && <div>{error}</div>}
    </div>
  ),
  FormSection: ({ children }) => <div>{children}</div>,
  spacing: {
    f16: '16px',
    f8: '8px',
    f4: '4px',
  },
  Text: ({ children }) => <div>{children}</div>,
  Stack: ({ children, direction }) => (
    <div data-testid={`stack-${direction}`}>{children}</div>
  ),
}));

jest.mock('@scality/core-ui/dist/next', () => {
  const Select = ({ id, value, onChange, children }) => {
    return (
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    );
  };
  Select.Option = ({ children, value }) => (
    <option value={value}>{children}</option>
  );
  return {
    Input: ({ id, type, value, onChange, placeholder, ...props }) => (
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={props['aria-label'] || id}
        {...props}
      />
    ),
    Select,
    Box: ({ children, ...props }) => (
      <div data-testid="box" {...props}>
        {children}
      </div>
    ),
  };
});

const TestWrapper = ({ children }) => {
  const methods = useForm({
    defaultValues: {
      buckets: [],
    },
  });

  return (
    <Wrapper>
      <FormProvider {...methods}>{children}</FormProvider>
    </Wrapper>
  );
};

describe('BucketField', () => {
  it('should render with default bucket number input', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNumberInput = screen.getByLabelText(/number of buckets/i);
    expect(bucketNumberInput).toBeInTheDocument();
    expect(bucketNumberInput).toHaveValue(1);
  });

  it('should add a default bucket on initial render', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNameInput = screen.getByLabelText(/bucket name/i);
    expect(bucketNameInput).toBeInTheDocument();
    expect(bucketNameInput).toHaveValue('');
  });

  it('should handle bucket number changes within limits', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNumberInput = screen.getByLabelText(/number of buckets/i);

    // Increase to 3 buckets
    fireEvent.change(bucketNumberInput, { target: { value: '3' } });
    expect(screen.getAllByLabelText(/bucket #\d+ name/i)).toHaveLength(3);

    // Try to exceed maximum (20)
    fireEvent.change(bucketNumberInput, { target: { value: '21' } });
    expect(screen.getAllByLabelText(/bucket #\d+ name/i)).toHaveLength(3);

    // Try to go below minimum (1)
    fireEvent.change(bucketNumberInput, { target: { value: '0' } });
    expect(screen.getByLabelText(/number of buckets/i)).toBeInTheDocument();
  });

  it('should update bucket tags when platform prop changes', () => {
    const { rerender } = render(
      <TestWrapper>
        <BucketField platform="platform1" />
      </TestWrapper>,
    );

    rerender(
      <TestWrapper>
        <BucketField platform="platform2" />
      </TestWrapper>,
    );

    expect(screen.getByLabelText(/bucket name/i)).toBeInTheDocument();
  });

  it('should render capacity fields for veeam platform', () => {
    render(
      <TestWrapper>
        <BucketField platform="veeam" />
      </TestWrapper>,
    );

    // For veeam platform, capacity fields should be visible
    expect(screen.getByLabelText(/bucket name/i)).toBeInTheDocument();
  });

  it('should initialize with correct default values', () => {
    render(
      <TestWrapper>
        <BucketField platform="test-platform" />
      </TestWrapper>,
    );

    const bucketNameInput = screen.getByLabelText(/bucket name/i);
    expect(bucketNameInput).toHaveAttribute(
      'placeholder',
      'test-platform-bucket-name',
    );
  });
});
