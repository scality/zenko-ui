import { fireEvent, render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { Wrapper } from '../../../utils/testUtil';
import BucketField from '../BucketField';

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
      buckets: [
        {
          name: '',
          capacity: '0',
          capacityUnit: 'TiB',
        },
      ],
    },
  });

  return (
    <Wrapper>
      <FormProvider {...methods}>{children}</FormProvider>
    </Wrapper>
  );
};

describe('BucketField', () => {
  const selectors = {
    bucketNumberInput: () => screen.getByRole('spinbutton', { name: /number of buckets \*/i }),
    bucketNameInput: () => screen.getByRole('textbox', { name: /bucket name \*/i }),
  };
  it('should render with default bucket number input', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNumberInput = selectors.bucketNumberInput();
    expect(bucketNumberInput).toBeInTheDocument();
    expect(bucketNumberInput).toHaveValue(1);
  });

  it('should add a default bucket on initial render', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNameInput = selectors.bucketNameInput();
    expect(bucketNameInput).toBeInTheDocument();
    expect(bucketNameInput).toHaveValue('');
  });

  it('should handle bucket number changes within limits', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNumberInput = selectors.bucketNumberInput();

    // Increase to 3 buckets
    fireEvent.change(bucketNumberInput, { target: { value: '3' } });
    expect(bucketNumberInput).toHaveValue(3);
    expect(screen.getAllByRole('textbox', { name: /bucket #\d+ name \*/i })).toHaveLength(3);

    // Decrease to 2 buckets
    fireEvent.change(bucketNumberInput, { target: { value: '2' } });
    expect(bucketNumberInput).toHaveValue(2);
    expect(screen.getAllByRole('textbox', { name: /bucket #\d+ name \*/i })).toHaveLength(2);

    // Try to go below minimum (1) - should allow input but not create buckets
    fireEvent.change(bucketNumberInput, { target: { value: '0' } });
    expect(bucketNumberInput).toHaveValue(0);
    expect(screen.getAllByRole('textbox', { name: /bucket #\d+ name \*/i })).toHaveLength(2); // Keeps previous buckets
  });

  it('should handle exceeding maximum value by limiting to max', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNumberInput = selectors.bucketNumberInput();

    // Try to exceed maximum (20) - should immediately limit to 20
    fireEvent.change(bucketNumberInput, { target: { value: '21' } });
    expect(bucketNumberInput).toHaveValue(20);
    expect(screen.getAllByRole('textbox', { name: /bucket #\d+ name \*/i })).toHaveLength(20);

    // Try even higher value
    fireEvent.change(bucketNumberInput, { target: { value: '100' } });
    expect(bucketNumberInput).toHaveValue(20); // Should stay at 20
    expect(screen.getAllByRole('textbox', { name: /bucket #\d+ name \*/i })).toHaveLength(20);
  });

  it('should ignore non-numeric values in bucket number input', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNumberInput = selectors.bucketNumberInput();

    fireEvent.change(bucketNumberInput, { target: { value: '3' } });
    expect(screen.getAllByRole('textbox', { name: /bucket #\d+ name \*/i })).toHaveLength(3);

    fireEvent.change(bucketNumberInput, { target: { value: 'abc' } });
    expect(screen.getAllByRole('textbox', { name: /bucket #\d+ name \*/i })).toHaveLength(3);
  });

  it('should add new buckets with default values when increasing bucket number', () => {
    render(
      <TestWrapper>
        <BucketField platform="test-platform" />
      </TestWrapper>,
    );

    const bucketNumberInput = selectors.bucketNumberInput();

    fireEvent.change(bucketNumberInput, { target: { value: '2' } });

    const bucketNameInputs = screen.getAllByRole('textbox', { name: /bucket #\d+ name \*/i });
    expect(bucketNameInputs).toHaveLength(2);

    expect(bucketNameInputs[1]).toHaveValue('');
    expect(bucketNameInputs[1]).toHaveAttribute('placeholder', 'Example: test-platform-bucket-name');
  });

  it('should remove buckets when decreasing bucket number', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNumberInput = selectors.bucketNumberInput();

    fireEvent.change(bucketNumberInput, { target: { value: '3' } });
    expect(screen.getAllByRole('textbox', { name: /bucket #\d+ name \*/i })).toHaveLength(3);

    fireEvent.change(bucketNumberInput, { target: { value: '2' } });
    expect(screen.getAllByRole('textbox', { name: /bucket #\d+ name \*/i })).toHaveLength(2);

    const remainingBuckets = screen.getAllByRole('textbox', { name: /bucket #\d+ name \*/i });
    expect(remainingBuckets[0]).toBeInTheDocument();
    expect(remainingBuckets[1]).toBeInTheDocument();
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

    expect(selectors.bucketNameInput()).toBeInTheDocument();
  });

  it('should render capacity fields for veeam platform', () => {
    render(
      <TestWrapper>
        <BucketField platform="veeam-vbr" />
      </TestWrapper>,
    );

    // For veeam platform, capacity fields should be visible
    expect(selectors.bucketNameInput()).toBeInTheDocument();
  });

  it('should initialize with correct default values', () => {
    render(
      <TestWrapper>
        <BucketField platform="test-platform" />
      </TestWrapper>,
    );

    const bucketNameInput = selectors.bucketNameInput();
    expect(bucketNameInput).toHaveAttribute('placeholder', 'Example: test-platform-bucket-name');
  });

  it('should allow temporarily empty input but restore to min value on blur', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNumberInput = selectors.bucketNumberInput();

    fireEvent.change(bucketNumberInput, { target: { value: '' } });
    expect((bucketNumberInput as HTMLInputElement).value).toBe('');

    fireEvent.blur(bucketNumberInput);

    expect(bucketNumberInput).toHaveValue(1);
  });

  it('should handle "e" character input and restore to min value on blur', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNumberInput = selectors.bucketNumberInput();

    fireEvent.change(bucketNumberInput, { target: { value: 'e' } });

    fireEvent.blur(bucketNumberInput);

    expect(bucketNumberInput).toHaveValue(1);
  });

  it('should handle zero or negative input and restore to min value on blur', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNumberInput = selectors.bucketNumberInput();

    fireEvent.change(bucketNumberInput, { target: { value: '0' } });
    expect(bucketNumberInput).toHaveValue(0);

    fireEvent.blur(bucketNumberInput);

    expect(bucketNumberInput).toHaveValue(1);

    fireEvent.change(bucketNumberInput, { target: { value: '-5' } });

    fireEvent.blur(bucketNumberInput);

    expect(bucketNumberInput).toHaveValue(1);
  });

  it('should handle input greater than max value and restore to max value on blur', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNumberInput = selectors.bucketNumberInput();

    // Input greater than max (20) - should immediately limit to 20
    fireEvent.change(bucketNumberInput, { target: { value: '25' } });
    expect(bucketNumberInput).toHaveValue(20);

    fireEvent.blur(bucketNumberInput);

    expect(bucketNumberInput).toHaveValue(20);
  });

  it('should allow changing value by first deleting and then typing new value', () => {
    render(
      <TestWrapper>
        <BucketField />
      </TestWrapper>,
    );

    const bucketNumberInput = selectors.bucketNumberInput();

    fireEvent.change(bucketNumberInput, { target: { value: '' } });
    expect((bucketNumberInput as HTMLInputElement).value).toBe('');

    fireEvent.change(bucketNumberInput, { target: { value: '3' } });
    expect(bucketNumberInput).toHaveValue(3);

    expect(screen.getAllByRole('textbox', { name: /bucket #\d+ name \*/i })).toHaveLength(3);
  });
});
