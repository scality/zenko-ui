import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  QueryFunctionContext,
  QueryObserverIdleResult,
  QueryObserverLoadingErrorResult,
  QueryObserverLoadingResult,
  QueryObserverOptions,
  QueryObserverSuccessResult,
  UseInfiniteQueryOptions,
} from 'react-query';
import { useInfiniteQuery } from 'react-query';
import { useAccessToken } from '../next-architecture/ui/AuthProvider';

export type AWS_PAGINATED_ENTITIES<ENTITY> =
  | (QueryObserverIdleResult<ENTITY[]> & { firstPageStatus: 'idle' }) //idle
  | (QueryObserverLoadingErrorResult<ENTITY[]> & {
      firstPageStatus: 'success' | 'error';
    }) // error
  | (QueryObserverLoadingResult<ENTITY[]> & { firstPageStatus: 'loading' }) //loading
  | (Omit<QueryObserverLoadingResult<ENTITY[]>, 'data'> & {
      data: ENTITY[];
      firstPageStatus: 'success';
    }) //loading, data
  | (QueryObserverSuccessResult<ENTITY[]> & { firstPageStatus: 'success' }); // success, data

export type AWS_PAGINATED_QUERY<
  API_RESPONSE extends MARKER_TYPE,
  ENTITY,
  TError = unknown,
  MARKER_TYPE = { Marker?: string } | undefined,
> = {
  queryFn: (
    context: QueryFunctionContext,
    marker?: MARKER_TYPE,
  ) => Promise<API_RESPONSE>;
  onUnmountOrSettled?: (
    data: ENTITY[] | undefined,
    error: TError | null | { message: string } | unknown,
  ) => void;
  onPageSuccess?: (data: ENTITY[]) => void;
  getNextPageParam?: (lastPage: API_RESPONSE) => MARKER_TYPE | undefined;
} & Omit<QueryObserverOptions<API_RESPONSE, TError>, 'queryFn'>;

export const useAwsPaginatedEntities = <
  API_RESPONSE extends MARKER_TYPE,
  ENTITY,
  TError = unknown,
  MARKER_TYPE = { Marker?: string } | undefined,
>(
  reactQueryOptions: AWS_PAGINATED_QUERY<
    API_RESPONSE,
    ENTITY,
    TError,
    MARKER_TYPE
  > & { additionalDepsToUpdateQueryFn?: unknown[] },
  getEntitiesFromResult: (data: API_RESPONSE) => ENTITY[],
  preventNextPagesRetrieval = false,
): AWS_PAGINATED_ENTITIES<ENTITY> => {
  if (!reactQueryOptions.getNextPageParam) {
    reactQueryOptions.getNextPageParam = (lastPage: MARKER_TYPE) =>
      ((lastPage as { Marker?: string }).Marker
        ? { Marker: (lastPage as { Marker?: string }).Marker }
        : undefined) as MARKER_TYPE;
  }

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [firstPageStatus, setFirstPageStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');

  useEffect(() => {
    return () => {
      if (reactQueryOptions.onUnmountOrSettled) {
        reactQueryOptions.onUnmountOrSettled(undefined, {
          message: 'Unmounted',
        });
      }
    };
  }, []);

  /**
   * This is a workaround to ensure that the token is always up to date
   * when the queryFn is called. This is necessary because the token is
   * refreshed in the queryFn closure.
   */
  const token = useAccessToken();
  const ref =
    useRef<
      (
        context: QueryFunctionContext,
        marker?: MARKER_TYPE,
      ) => Promise<API_RESPONSE>
    >();
  useEffect(() => {
    ref.current = reactQueryOptions?.queryFn;
  }, [token, ...(reactQueryOptions.additionalDepsToUpdateQueryFn || [])]);
  //--------------------------------------------------------------------

  const {
    data,
    error,
    status: internalStatus,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...(reactQueryOptions as UseInfiniteQueryOptions<
      API_RESPONSE,
      TError,
      API_RESPONSE
    >),
    queryFn: (ctx) => {
      return ref.current?.(ctx, ctx.pageParam);
    },
  });

  const pageIndex = data?.pageParams?.length || 0;
  const entities =
    data &&
    data.pages &&
    data.pages.flatMap((page) => getEntitiesFromResult(page));

  useMemo(() => {
    if (pageIndex === 0 || (pageIndex === 1 && internalStatus === 'success')) {
      setFirstPageStatus(internalStatus);
    }
  }, [internalStatus, pageIndex]);

  useMemo(() => {
    if (
      internalStatus === 'idle' ||
      internalStatus === 'loading' ||
      internalStatus === 'error'
    ) {
      setStatus(internalStatus);
      if (internalStatus === 'error' && reactQueryOptions.onUnmountOrSettled) {
        reactQueryOptions.onUnmountOrSettled(entities, error);
      }
    } else if (
      internalStatus === 'success' &&
      !hasNextPage &&
      !isFetchingNextPage
    ) {
      setStatus('success');
      if (reactQueryOptions.onPageSuccess) {
        reactQueryOptions.onPageSuccess(entities || []);
      }
      if (reactQueryOptions.onUnmountOrSettled) {
        reactQueryOptions.onUnmountOrSettled(entities, null);
      }
      setFirstPageStatus('success'); //ensure firstPageStatus is success when loading data from the cache
    } else if (!isFetchingNextPage) {
      if (reactQueryOptions.onPageSuccess) {
        reactQueryOptions.onPageSuccess(entities || []);
      }
      if (!preventNextPagesRetrieval) {
        fetchNextPage();
      }
    }
  }, [internalStatus, hasNextPage, fetchNextPage, isFetchingNextPage]);

  return {
    data: entities,
    status,
    firstPageStatus,
  } as AWS_PAGINATED_ENTITIES<ENTITY>;
};

type AccessKeyObject = {
  accessKey: string;
  createdOn: string;
  status: string;
};

export const useAccessKeyOutdatedStatus = (
  accessKeyObject: AccessKeyObject,
) => {
  // We consider if the access key was created 300 days ago is bad practice.
  // Return the hardcoded alert for the moment, later on we should retrieve it from AlertManager.
  const outDatedAccessMsg =
    'This access key has been generated more than 300 days ago. Please consider change it';
  const OUTDATED_DAYS = 300;
  const createdDate = DateTime.fromISO(accessKeyObject.createdOn);
  const currentDate = DateTime.now();
  const diffInDays = currentDate.diff(createdDate, 'days');
  const days = Math.floor(diffInDays.toObject().days || 0);

  if (days > OUTDATED_DAYS) {
    return outDatedAccessMsg;
  } else {
    return '';
  }
};
