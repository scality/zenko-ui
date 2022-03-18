import { useState, useMemo } from 'react';
import { useInfiniteQuery } from 'react-query';
import type {
  QueryObserverOptions,
  QueryFunctionContext,
  QueryObserverIdleResult,
  QueryObserverLoadingErrorResult,
  QueryObserverLoadingResult,
  QueryObserverSuccessResult,
} from 'react-query';
import { DateTime } from 'luxon';

type AWS_PAGINATED_ENTITIES<ENTITY> =
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
export const useAwsPaginatedEntities = <
  API_RESPONSE extends {
    Marker?: string;
  },
  ENTITY,
>(
  reactQueryOptions:
    | {
        queryFn: (
          context: QueryFunctionContext,
          marker?: string,
        ) => Promise<API_RESPONSE>;
      }
    | Omit<QueryObserverOptions<API_RESPONSE>, 'queryFn'>,
  getEntitiesFromResult: (data: API_RESPONSE) => ENTITY[],
): AWS_PAGINATED_ENTITIES<ENTITY> => {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [firstPageStatus, setFirstPageStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const {
    data,
    status: internalStatus,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...reactQueryOptions,
    queryKey: [...reactQueryOptions.queryKey],
    queryFn: (ctx) => {
      return reactQueryOptions.queryFn(ctx, ctx.pageParam);
    },
    getNextPageParam: (lastPage) => lastPage.Marker,
  });
  const pageIndex = data?.pageParams?.length || 0;
  useMemo(() => {
    if (pageIndex === 0 || (pageIndex === 1 && internalStatus === 'success')) {
      setFirstPageStatus(internalStatus);
    }
  }, [internalStatus, pageIndex]);
  useMemo(() => {
    if (internalStatus === 'loading' || internalStatus === 'error') {
      setStatus(internalStatus);
    }

    if (internalStatus === 'success' && !hasNextPage && !isFetchingNextPage) {
      setStatus('success');
      setFirstPageStatus('success'); //ensure firstPageStatus is success when loading data from the cache
    } else {
      fetchNextPage();
    }
  }, [internalStatus, hasNextPage, fetchNextPage, isFetchingNextPage]);

  return {
    data:
      data &&
      data.pages &&
      data.pages.flatMap((page) => getEntitiesFromResult(page)),
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
  const days = Math.floor(diffInDays.toObject().days);

  if (days > OUTDATED_DAYS) {
    return outDatedAccessMsg;
  } else {
    return '';
  }
};
