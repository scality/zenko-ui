//@flow
import { useState, useMemo } from 'react';
import { useInfiniteQuery } from 'react-query';
// $FlowFixMe
import type { QueryOptions, QueryFunctionContext } from 'react-query';
import { DateTime } from 'luxon';

export const useAwsPaginatedEntities = <
  API_RESPONSE: { Marker?: string },
  ENTITY,
>(
  reactQueryOptions: QueryOptions<API_RESPONSE> & {
    queryFn: (
      context: QueryFunctionContext,
      marker?: string,
    ) => Promise<API_RESPONSE>,
  },
  getEntitiesFromResult: (data: API_RESPONSE) => ENTITY[],
): { data: ENTITY[], status: 'idle' | 'loading' | 'error' | 'success' } => {
  const [status, setStatus] = useState('idle');

  const {
    data,
    status: internalStatus,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    ...reactQueryOptions,
    queryKey: [...reactQueryOptions.queryKey],
    queryFn: ctx => reactQueryOptions.queryFn(ctx, ctx.pageParam),
    getNextPageParam: lastPage => lastPage.Marker,
  });

  useMemo(() => {
    if (internalStatus === 'loading' || internalStatus === 'error') {
      setStatus(internalStatus);
    }
    if (internalStatus === 'success' && !hasNextPage) {
      setStatus('success');
    } else {
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalStatus, hasNextPage]);

  return {
    data:
      data &&
      data.pages &&
      data.pages.flatMap(page => getEntitiesFromResult(page)),
    status,
  };
};

type AccessKeyObject = {
  accessKey: string,
  createdOn: string,
  status: string,
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
