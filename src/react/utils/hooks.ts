import { useShellHooks } from '@scality/module-federation';
import { useEffect, useRef, useState } from 'react';
import { type QueryKey, type UseQueryOptions, type UseQueryResult, useQuery } from 'react-query';
import { useLocation } from 'react-router';
import { getRolesForWebIdentity } from '../../js/IAMClient';
import type { ApiError } from '../../types/actions';
import type { Account, WebIdentityRoles } from '../../types/iam';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useDataServiceRole } from '../DataServiceRoleProvider';
import { useErrorHandler } from '../ErrorProvider';
import { useConfig } from '../next-architecture/ui/ConfigProvider';
import { addTrailingSlash, errorParser } from '.';
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
  onUnmountOrSettled?: (data: TData | undefined, error: TError | { message: string } | null) => void;
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
// arn:aws:sts::142222634614:assumed-role/storage-manager-role/ui-9160673b-2c2a-4a6f-a1ef-a3cb6ce25d7f
// arn:aws:iam::142222634614:role/scality-internal/storage-manager-role
export const regexArn =
  /arn:aws:(?:iam|sts)::(?<account_id>\d{12}):(?<resource_type>role|policy|assumed-role)\/(?<path>(?:[^/]*\/)*)(?<name>[^/]+)$/;

export const STORAGE_MANAGER_ROLE = 'storage-manager-role';
export const STORAGE_ACCOUNT_OWNER_ROLE = 'storage-account-owner-role';
export const STORAGE_USAGE_CONSUMER_ROLE = 'storage-usage-consumer-role';
const DATA_CONSUMER_ROLE = 'data-consumer-role';
const DATA_ACCESSOR_ROLE = 'data-accessor-role';
export const SCALITY_INTERNAL_ROLES = [
  STORAGE_MANAGER_ROLE,
  STORAGE_ACCOUNT_OWNER_ROLE,
  STORAGE_USAGE_CONSUMER_ROLE,
  DATA_CONSUMER_ROLE,
  DATA_ACCESSOR_ROLE,
];
export const SCALITY_IAM_ROLES = [
  STORAGE_ACCOUNT_OWNER_ROLE,
  STORAGE_USAGE_CONSUMER_ROLE,
  DATA_CONSUMER_ROLE,
  DATA_ACCESSOR_ROLE,
];

const defaultEventDispatcher = () => {
  const { handleClientError, showModalError } = useErrorHandler();
  return {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    notifyLoadingAccounts: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    notifyEnd: () => {},
    notifyError: (error: ApiError) => {
      try {
        handleClientError(error);
      } catch (err) {
        showModalError(errorParser(err as ApiError).message);
      }
    },
  };
};

export const noopBasedEventDispatcher = () => ({
  notifyLoadingAccounts: () => {
    console.log('Loading accounts...');
  },
  notifyEnd: () => {
    console.log('Loading accounts finished');
  },
  notifyError: (err: ApiError) => {
    console.log('Loading accounts failed', err);
  },
});

export const useAccounts = (
  eventDispatcher: () => {
    notifyLoadingAccounts: () => void;
    notifyEnd: () => void;
    notifyError: (error: ApiError) => void;
  } = defaultEventDispatcher,
) => {
  const { useAuth } = useShellHooks();
  const { getToken } = useAuth();

  const { iamEndpoint } = useConfig();

  const { notifyLoadingAccounts, notifyEnd, notifyError } = eventDispatcher();

  const { data, status } = useAwsPaginatedEntities<WebIdentityRoles, Account, ApiError>(
    {
      queryKey: ['WebIdentityRoles'],
      queryFn: async (_, marker) => {
        notifyLoadingAccounts();
        return getRolesForWebIdentity(iamEndpoint, notFalsyTypeGuard(await getToken()), marker?.Marker);
      },
      enabled: !!iamEndpoint,
      staleTime: Infinity,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      onUnmountOrSettled: (_, error) => {
        if (!error) {
          notifyEnd();
        } else {
          //@ts-expect-error fix this when you are working on it
          if (error?.message === 'Unmounted') {
            notifyEnd();
            return;
          }
          notifyError(error as ApiError);
        }
      },
    },
    (data) => data?.Accounts,
  );

  const uniqueAccountsWithRoles = Object.values(
    data?.reduce(
      (agg, current) => ({
        ...agg,
        [current.Name]: {
          Name: current.Name,
          CreationDate: current.CreationDate,
          Roles: [...(agg[current.Name]?.Roles || []), ...current.Roles],
          id: regexArn.exec(current.Roles[0].Arn).groups['account_id'],
        },
      }),
      {} as Record<string, Account>,
    ) || {},
  );
  return {
    accounts: uniqueAccountsWithRoles.filter((account) => account.Name !== 'scality-internal-services'),
    status,
  };
};

export const useRolePathName = () => {
  const { roleArn } = useDataServiceRole();
  const parsedArn = regexArn.exec(roleArn);
  const rolePath = parsedArn?.groups['path'] || '';
  const roleName = parsedArn?.groups['name'] || '';
  const rolePathName = rolePath + roleName;
  return rolePathName;
};

export const useAuthGroups = () => {
  const { useAuth } = useShellHooks();
  const user = useAuth();
  const userGroups = user.userData?.groups || [];

  const isStorageManager = userGroups.includes('StorageManager');
  const isPlatformAdmin = userGroups.includes('PlatformAdmin');

  return { isStorageManager, isPlatformAdmin };
};

export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>(undefined);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
