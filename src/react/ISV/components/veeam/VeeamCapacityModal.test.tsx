import { usePutObject } from '@scality/data-browser-library';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewWrapper } from '../../../utils/testUtil';
import { VeeamCapacityModal } from './VeeamCapacityModal';

const mockUsePutObject = usePutObject as jest.Mock;
const mockMutate = jest.fn();
const bucketName = 'test-bucket';

describe('VeeamCapacityModal', () => {
  const selectors = {
    modalTitle: () => screen.getByText('Edit max repository capacity'),
    editBtn: () => screen.getByLabelText('Edit max capacity'),
    cancelBtn: () => screen.getByText('Cancel'),
    editModalBtn: () => screen.getByLabelText('Update max capacity'),
    capacityInput: () => screen.getByRole('spinbutton', { name: /Max Capacity/ }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePutObject.mockReturnValue({
      mutate: mockMutate.mockImplementation((_, options) => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      }),
      mutateAsync: jest.fn(),
      status: 'idle',
      isIdle: true,
      isLoading: false,
      isSuccess: false,
      isError: false,
      data: undefined,
      error: null,
      reset: jest.fn(),
    });

    render(<VeeamCapacityModal bucketName={bucketName} maxCapacity={114748364800} status={'success'} />, {
      wrapper: NewWrapper(),
    });
  });

  it('should render the modal', () => {
    fireEvent.click(selectors.editBtn());
    expect(selectors.modalTitle()).toBeInTheDocument();
  });

  it('should enable confirm button when value is valid', async () => {
    await userEvent.click(selectors.editBtn());

    await userEvent.clear(selectors.capacityInput());
    expect(selectors.editModalBtn()).toBeDisabled();
    await userEvent.type(selectors.capacityInput(), '2.2');

    expect(selectors.editModalBtn()).toBeEnabled();
  });

  it('should call mutate with correct XML when confirm button is clicked', async () => {
    fireEvent.click(selectors.editBtn());
    fireEvent.change(selectors.capacityInput(), { target: { value: '200' } });

    await waitFor(async () => {
      expect(selectors.editModalBtn()).toBeEnabled();
    });
    fireEvent.click(selectors.editModalBtn());

    await waitFor(async () => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: bucketName,
          Body: '<?xml version="1.0" encoding="utf-8" ?><CapacityInfo><Capacity>214748364800</Capacity><Available>0</Available><Used>0</Used></CapacityInfo>',
          ContentType: 'text/xml',
        }),
        expect.any(Object),
      );
    });
  });
  it('should validate capacity value correctly : number less than 1', async () => {
    const user = userEvent.setup();
    await user.click(selectors.editBtn());
    await waitFor(() => {
      expect(selectors.modalTitle()).toBeInTheDocument();
    });

    const capacityInput = selectors.capacityInput();
    await user.clear(capacityInput);
    await user.type(capacityInput, '0');

    await waitFor(
      () => {
        expect(selectors.editModalBtn()).toBeDisabled();
        expect(screen.getByText(/"capacity" must be greater than or equal to 1/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
  it('should validate capacity value correctly : number greater than 1024', async () => {
    fireEvent.click(selectors.editBtn());
    fireEvent.change(selectors.capacityInput(), { target: { value: '1025' } });

    await waitFor(async () => {
      expect(selectors.editModalBtn()).toBeDisabled();
      expect(screen.getByText(/"capacity" must be less than or equal to 1024/i)).toBeInTheDocument();
    });
  });
  it('should validate capacity value correctly : number with more than 2 decimals', async () => {
    fireEvent.click(selectors.editBtn());
    fireEvent.change(selectors.capacityInput(), {
      target: { value: '12.345' },
    });

    await waitFor(async () => {
      expect(selectors.editModalBtn()).toBeDisabled();
      expect(screen.getByText(/"capacity" must have at most 2 decimals/i)).toBeInTheDocument();
    });
  });
  it('should validate capacity value correctly : number is required', async () => {
    fireEvent.click(selectors.editBtn());
    fireEvent.change(selectors.capacityInput(), {
      target: { value: '' },
    });

    await waitFor(async () => {
      expect(selectors.editModalBtn()).toBeDisabled();
      expect(screen.getByText(/"capacity" must be a number/i)).toBeInTheDocument();
    });
  });

  it('should call onCapacityUpdated after successful mutation', async () => {
    cleanup();
    const onCapacityUpdated = jest.fn();

    render(
      <VeeamCapacityModal
        bucketName={bucketName}
        maxCapacity={114748364800}
        status={'success'}
        onCapacityUpdated={onCapacityUpdated}
      />,
      { wrapper: NewWrapper() },
    );

    fireEvent.click(selectors.editBtn());
    fireEvent.change(selectors.capacityInput(), { target: { value: '200' } });

    await waitFor(() => {
      expect(selectors.editModalBtn()).toBeEnabled();
    });
    fireEvent.click(selectors.editModalBtn());

    await waitFor(() => {
      expect(onCapacityUpdated).toHaveBeenCalledWith(214748364800);
    });
  });

  it('should display error toast if mutation failed', async () => {
    mockMutate.mockImplementation((_, options) => {
      if (options?.onError) {
        options.onError(new Error('The specified bucket does not exist.'));
      }
    });

    fireEvent.click(selectors.editBtn());
    fireEvent.change(selectors.capacityInput(), { target: { value: '200' } });

    await waitFor(async () => {
      expect(selectors.editModalBtn()).toBeEnabled();
    });
    fireEvent.click(selectors.editModalBtn());

    await waitFor(async () => {
      expect(
        screen.getByText('Failed to update repository capacity: The specified bucket does not exist.'),
      ).toBeInTheDocument();
    });
  });
});
