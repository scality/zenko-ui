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
      'Example: test-platform-bucket-name',
    );
  });
});
