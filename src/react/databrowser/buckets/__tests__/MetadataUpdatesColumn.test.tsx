import { type Bucket, useGetBucketLocation } from '@scality/data-browser-library';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { theme } from '../../../utils/testUtil';
import { MetadataUpdatesColumn } from '../MetadataUpdatesColumn';

const mockUseGetBucketLocation = jest.mocked(useGetBucketLocation);

const mockUseInstanceStatusQuery = jest.fn();
jest.mock('../../../queries/instanceStatusQuery', () => ({
  useInstanceStatusQuery: () => mockUseInstanceStatusQuery(),
}));

const renderColumn = (bucketName = 'test-bucket') =>
  render(
    <ThemeProvider theme={theme}>
      <MetadataUpdatesColumn data={{ Name: bucketName } as Bucket} />
    </ThemeProvider>,
  );

describe('MetadataUpdatesColumn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render status while bucket location is loading', () => {
    mockUseGetBucketLocation.mockReturnValue({
      data: undefined,
      status: 'pending',
    } as any);
    mockUseInstanceStatusQuery.mockReturnValue({
      data: undefined,
      status: 'success',
    });

    renderColumn();

    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.queryByText('Paused')).not.toBeInTheDocument();
  });

  it('should not render status while instance status is loading', () => {
    mockUseGetBucketLocation.mockReturnValue({
      data: { LocationConstraint: 'test-xdm' },
      status: 'success',
    } as any);
    mockUseInstanceStatusQuery.mockReturnValue({
      data: undefined,
      status: 'loading',
    });

    renderColumn();

    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.queryByText('Paused')).not.toBeInTheDocument();
  });

  it('should not render status when bucket location query fails', () => {
    mockUseGetBucketLocation.mockReturnValue({
      data: undefined,
      status: 'error',
    } as any);
    mockUseInstanceStatusQuery.mockReturnValue({
      data: { metrics: { 'ingest-schedule': { states: {} } } },
      status: 'success',
    });

    renderColumn();

    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.queryByText('Paused')).not.toBeInTheDocument();
  });

  it('should not render status when instance status query fails', () => {
    mockUseGetBucketLocation.mockReturnValue({
      data: { LocationConstraint: 'test-xdm' },
      status: 'success',
    } as any);
    mockUseInstanceStatusQuery.mockReturnValue({
      data: undefined,
      status: 'error',
    });

    renderColumn();

    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.queryByText('Paused')).not.toBeInTheDocument();
  });

  it('should show "Active" when ingestion is enabled for bucket location', () => {
    mockUseGetBucketLocation.mockReturnValue({
      data: { LocationConstraint: 'test-xdm' },
      status: 'success',
    } as any);
    mockUseInstanceStatusQuery.mockReturnValue({
      data: {
        metrics: {
          'ingest-schedule': { states: { 'test-xdm': 'enabled' } },
        },
      },
      status: 'success',
    });

    renderColumn();

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should show "Paused" when ingestion is disabled for bucket location', () => {
    mockUseGetBucketLocation.mockReturnValue({
      data: { LocationConstraint: 'test-xdm' },
      status: 'success',
    } as any);
    mockUseInstanceStatusQuery.mockReturnValue({
      data: {
        metrics: {
          'ingest-schedule': { states: { 'test-xdm': 'disabled' } },
        },
      },
      status: 'success',
    });

    renderColumn();

    expect(screen.getByText('Paused')).toBeInTheDocument();
  });

  it('should not show Active or Paused when bucket has no ingestion', () => {
    mockUseGetBucketLocation.mockReturnValue({
      data: { LocationConstraint: 'us-east-1' },
      status: 'success',
    } as any);
    mockUseInstanceStatusQuery.mockReturnValue({
      data: {
        metrics: {
          'ingest-schedule': { states: {} },
        },
      },
      status: 'success',
    });

    renderColumn();

    expect(screen.queryByText('Active')).not.toBeInTheDocument();
    expect(screen.queryByText('Paused')).not.toBeInTheDocument();
  });
});
