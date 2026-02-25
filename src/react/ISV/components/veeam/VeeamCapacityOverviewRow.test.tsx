import { useGetBucketTagging, useGetObject } from '@scality/data-browser-library';
import { render, screen, waitFor } from '@testing-library/react';
import { mockOffsetSize, NewWrapper } from '../../../utils/testUtil';
import { VeeamApplicationType } from '../../constants';
import { VeeamCapacityOverviewRow } from './VeeamCapacityOverviewRow';

const mockUseGetBucketTagging = useGetBucketTagging as jest.Mock;
const mockUseGetObject = useGetObject as jest.Mock;

const bucketName = 'test-bucket';

describe('VeeamCapacityOverviewRow', () => {
  beforeAll(() => {
    mockOffsetSize(200, 100);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render the VeeamCapacityOverviewRow', async () => {
    mockUseGetBucketTagging.mockReturnValue({
      data: {
        TagSet: [
          {
            Key: 'X-Scality-Veeam-Application',
            Value: VeeamApplicationType.VEEAM_BACKUP_REPLICATION,
          },
        ],
      },
      status: 'success',
      isLoading: false,
      isSuccess: true,
      isError: false,
    });

    mockUseGetObject.mockReturnValue({
      data: {
        Body: Buffer.from(`<?xml version="1.0" encoding="UTF-8" ?>
          <CapacityInfo>
            <Capacity>107374182400</Capacity>
            <Available>107374182400</Available>
            <Used>0</Used>
          </CapacityInfo>`),
      },
      status: 'success',
      isLoading: false,
      isSuccess: true,
      isError: false,
    });

    render(<VeeamCapacityOverviewRow bucketName={bucketName} />, {
      wrapper: NewWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Max repository Capacity')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('100.00 GiB')).toBeInTheDocument();
    });
  });

  it('should not render the row if SOSAPI is not enabled', () => {
    mockUseGetBucketTagging.mockReturnValue({
      data: {
        TagSet: [
          {
            Key: 'X-Scality-Veeam-Application',
            Value: 'Test Application',
          },
        ],
      },
      status: 'success',
      isLoading: false,
      isSuccess: true,
      isError: false,
    });

    mockUseGetObject.mockReturnValue({
      data: undefined,
      status: 'idle',
      isLoading: false,
      isSuccess: false,
      isError: false,
    });

    render(<VeeamCapacityOverviewRow bucketName={bucketName} />, {
      wrapper: NewWrapper(),
    });
    expect(screen.queryByText('Max repository Capacity')).not.toBeInTheDocument();
  });

  it('should display loading state', async () => {
    mockUseGetBucketTagging.mockReturnValue({
      data: {
        TagSet: [
          {
            Key: 'X-Scality-Veeam-Application',
            Value: VeeamApplicationType.VEEAM_BACKUP_REPLICATION,
          },
        ],
      },
      status: 'success',
      isLoading: false,
      isSuccess: true,
      isError: false,
    });

    mockUseGetObject.mockReturnValue({
      data: undefined,
      status: 'loading',
      isLoading: true,
      isSuccess: false,
      isError: false,
    });

    render(<VeeamCapacityOverviewRow bucketName={bucketName} />, {
      wrapper: NewWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Max repository Capacity')).toBeInTheDocument();
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error state', async () => {
    mockUseGetBucketTagging.mockReturnValue({
      data: {
        TagSet: [
          {
            Key: 'X-Scality-Veeam-Application',
            Value: VeeamApplicationType.VEEAM_BACKUP_REPLICATION,
          },
        ],
      },
      status: 'success',
      isLoading: false,
      isSuccess: true,
      isError: false,
    });

    mockUseGetObject.mockReturnValue({
      data: undefined,
      status: 'error',
      isLoading: false,
      isSuccess: false,
      isError: true,
      error: new Error('Not found'),
    });

    render(<VeeamCapacityOverviewRow bucketName={bucketName} />, {
      wrapper: NewWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Max repository Capacity')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });
});
