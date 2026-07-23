import React from 'react';

/**
 * Mock for @scality/data-browser-library
 *
 * This mock is necessary because:
 * 1. The library uses ESM modules which Jest 27 has limited support for
 * 2. The library uses @tanstack/react-query v5 while this project uses react-query v3
 * 3. Following unit testing best practices: mock external dependencies to isolate tests
 */

export const DataBrowserProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <>{children}</>;
};

export const useCreateBucket = jest.fn(() => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  status: 'idle',
  isIdle: true,
  isLoading: false,
  isSuccess: false,
  isError: false,
  data: undefined,
  error: null,
  reset: jest.fn(),
}));

export const useSetBucketVersioning = jest.fn(() => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  status: 'idle',
  isIdle: true,
  isLoading: false,
  isSuccess: false,
  isError: false,
  data: undefined,
  error: null,
  reset: jest.fn(),
}));

export const useSetBucketReplication = jest.fn(() => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  status: 'idle',
  isIdle: true,
  isLoading: false,
  isSuccess: false,
  isError: false,
  data: undefined,
  error: null,
  reset: jest.fn(),
}));

export const useSetBucketTagging = jest.fn(() => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  status: 'idle',
  isIdle: true,
  isLoading: false,
  isSuccess: false,
  isError: false,
  data: undefined,
  error: null,
  reset: jest.fn(),
}));

export const usePutObject = jest.fn(() => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  status: 'idle',
  isIdle: true,
  isLoading: false,
  isSuccess: false,
  isError: false,
  data: undefined,
  error: null,
  reset: jest.fn(),
}));

export const useGetBucketTagging = jest.fn(() => ({
  data: { TagSet: [] },
  status: 'success',
  isLoading: false,
  isSuccess: true,
  isError: false,
  error: null,
  refetch: jest.fn(),
}));

export const useGetBucketLocation = jest.fn(() => ({
  data: undefined,
  status: 'pending',
  isLoading: true,
  isSuccess: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
}));

export const useGetObject = jest.fn(() => ({
  data: undefined,
  status: 'idle',
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null,
  refetch: jest.fn(),
}));

export const DataBrowserUI = () => null;

export const useBuckets = jest.fn(() => ({
  data: undefined,
  status: 'idle',
  isLoading: false,
  isSuccess: false,
  isError: false,
  error: null,
}));
