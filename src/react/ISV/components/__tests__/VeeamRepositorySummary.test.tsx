import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Wrapper } from '../../../utils/testUtil';
import type { FormData } from '../../engine/types';
import { VeeamRepositorySummary } from '../VeeamRepositorySummary';

describe('VeeamRepositorySummary', () => {
  const mockOnFinish = jest.fn();

  const createMockFormData = (overrides: Partial<FormData> = {}): FormData => ({
    accountName: 'test-account',
    accountNameType: 'create',
    enableImmutableBackup: false,
    buckets: [{ name: 'test-bucket' }],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders repository summary correctly', async () => {
    const formData = createMockFormData({
      buckets: [{ name: 'my-repo' }, { name: 'repo-2' }],
      enableImmutableBackup: true,
      immutablePeriodDays: 30,
    });

    render(
      <Wrapper>
        <VeeamRepositorySummary formData={formData} onFinish={mockOnFinish} />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(screen.getByText(/2 Veeam repositories were successfully created/i)).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('30 day(s)')).toBeInTheDocument();
    });
  });

  it('calls onFinish when Exit button is clicked', async () => {
    const user = userEvent.setup();
    const formData = createMockFormData();

    render(
      <Wrapper>
        <VeeamRepositorySummary formData={formData} onFinish={mockOnFinish} />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: /Exit/i }));
    expect(mockOnFinish).toHaveBeenCalledTimes(1);
  });
});
