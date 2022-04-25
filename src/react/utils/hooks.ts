import { useEffect, useState } from 'react';
import {
  QueryKey,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from 'react-query';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { addTrailingSlash } from '.';
import { getRolesForWebIdentity } from '../../js/IAMClient';
import { Account } from '../../types/iam';
import { AppState } from '../../types/state';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useIAMClient } from '../IAMProvider';
import { useAwsPaginatedEntities } from './IAMhooks';
export const useHeight = (myRef) => {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const handleResize = () => {
      setHeight(myRef.current.offsetHeight);
    };

    if (myRef.current) {
      setHeight(myRef.current.offsetHeight);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [myRef]);
  return height;
};
export const useOutsideClick = (ref, actionFn) => {
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        actionFn();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, actionFn]);
};
export const useQueryParams = () => {
  return new URLSearchParams(useLocation().search);
};
export const usePrefixWithSlash = () => {
  const query = useQueryParams();
  const prefix = query.get('prefix');

  if (!prefix) {
    return '';
  }

  // If the prefix includes both folder and object, we have to remove the last part of the path which is the object key
  if (prefix && prefix.slice(-1) !== '/') {
    const prefixArr = prefix.split('/');
    prefixArr.pop();

    if (!prefixArr.length) {
      return '';
    }

    return addTrailingSlash(prefixArr.join('/'));
  } else {
    return prefix;
  }
};
export const COPY_STATE_IDLE = 'idle';
export const COPY_STATE_SUCCESS = 'success';
export const COPY_STATE_UNSUPPORTED = 'unsupported';
export const useClipboard = () => {
  const [copyStatus, setCopyStatus] = useState(COPY_STATE_IDLE);
  useEffect(() => {
    const timer = setTimeout(() => {
      setCopyStatus(COPY_STATE_IDLE);
    }, 2000);
    return () => clearTimeout(timer);
  }, [copyStatus]);

  const copyToClipboard = (text) => {
    if (!navigator || !navigator.clipboard) {
      setCopyStatus(COPY_STATE_UNSUPPORTED);
      return;
    }

    navigator.clipboard.writeText(text);
    setCopyStatus(COPY_STATE_SUCCESS);
  };

  return {
    copy: copyToClipboard,
    copyStatus: copyStatus,
  };
};

export function useQueryWithUnmountSupport<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>({
  onSettled,
  onUnmountOrSettled,
  ...args
}: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
  onUnmountOrSettled?: (
    data: TData | undefined,
    error: TError | { message: string } | null,
  ) => void;
}): UseQueryResult<TData, TError> {
  useEffect(() => {
    return () => {
      if (onUnmountOrSettled) {
        onUnmountOrSettled(undefined, { message: 'Unmounted' });
      }
    };
  }, []);

  const query = useQuery({
    ...args,
    onSettled: (data, err) => {
      if (onSettled) {
        onSettled(data, err);
      }
      if (onUnmountOrSettled) {
        onUnmountOrSettled(data, err);
      }
    },
  });
  return query;
}

export const useAccounts = () => {
  const token = useSelector((state: AppState) => state.oidc.user?.access_token);
  const IAMEndpoint = useSelector(
    (state: AppState) => state.auth.config.iamEndpoint,
  );

  const { status, data } = useAwsPaginatedEntities(
    {
      queryKey: ['WebIdentityRoles', token],
      queryFn: () => {
        return getRolesForWebIdentity(IAMEndpoint, token);
      },
      enabled: !!token && !!IAMEndpoint,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
    (data) => data.Accounts,
  );

  const uniqueAccountsWithRoles = Object.values(
    data?.reduce(
      (agg, current) => ({
        ...agg,
        [current.Name]: {
          Name: current.Name,
          CreationDate: current.CreationDate,
          Roles: [...(agg[current.Name]?.Roles || []), ...current.Roles],
        },
      }),
      {} as Record<string, Account>,
    ) || {},
  );

  return uniqueAccountsWithRoles.filter(
    (account) => account.Name !== 'scality-internal-services',
  );
};
