import { useEffect, useRef, useState } from 'react';
import {
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
  useQuery,
} from 'react-query';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { addTrailingSlash } from '.';
import { getRolesForWebIdentity } from '../../js/IAMClient';
import { ApiError } from '../../types/actions';
import { Account, WebIdentityRoles } from '../../types/iam';
import { notFalsyTypeGuard } from '../../types/typeGuards';
import { useDataServiceRole } from '../DataServiceRoleProvider';
import {
  handleApiError,
  handleClientError,
  networkEnd,
  networkStart,
} from '../actions';
import { useAccessToken, useAuth } from '../next-architecture/ui/AuthProvider';
import { useConfig } from '../next-architecture/ui/ConfigProvider';
import { useS3Client } from '../next-architecture/ui/S3ClientProvider';
import { getObjectsVersions } from '../queries';
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

export const regexArn =
  /arn:aws:iam::(?<account_id>\d{12}):(?<resource_type>role|policy)\/(?<path>(?:[^/]*\/)*)(?<name>[^/]+)$/;

export const STORAGE_MANAGER_ROLE = 'storage-manager-role';
export const STORAGE_ACCOUNT_OWNER_ROLE = 'storage-account-owner-role';
const DATA_CONSUMER_ROLE = 'data-consumer-role';
export const SCALITY_INTERNAL_ROLES = [
  STORAGE_MANAGER_ROLE,
  STORAGE_ACCOUNT_OWNER_ROLE,
  DATA_CONSUMER_ROLE,
];

const reduxBasedEventDispatcher = () => {
  const dispatch = useDispatch();
  return {
    notifyLoadingAccounts: () => dispatch(networkStart('Loading accounts...')),
    notifyEnd: () => dispatch(networkEnd()),
    notifyError: (error: ApiError) => {
      try {
        dispatch(handleClientError(error));
      } catch (err) {
        dispatch(handleApiError(err as ApiError, 'byModal'));
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
  } = reduxBasedEventDispatcher,
) => {
  const token = useAccessToken();
  const { iamEndpoint } = useConfig();

  const { notifyLoadingAccounts, notifyEnd, notifyError } = eventDispatcher();

  const { data, status } = useAwsPaginatedEntities<
    WebIdentityRoles,
    Account,
    ApiError
  >(
    {
      queryKey: ['WebIdentityRoles'],
      queryFn: (_, marker) => {
        notifyLoadingAccounts();
        return getRolesForWebIdentity(
          iamEndpoint,
          notFalsyTypeGuard(token),
          marker?.Marker,
        );
      },
      enabled: !!token && !!iamEndpoint,
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
          id: regexArn.exec(current.Roles[0].Arn).groups['account_id'],
        },
      }),
      {} as Record<string, Account>,
    ) || {},
  );
  return {
    accounts: uniqueAccountsWithRoles.filter(
      (account) => account.Name !== 'scality-internal-services',
    ),
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
  const user = useAuth();
  const userGroups = user.userData?.groups || [];

  const isStorageManager = userGroups.includes('StorageManager');
  const isPlatformAdmin = userGroups.includes('PlatformAdmin');

  return { isStorageManager, isPlatformAdmin };
};

export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export const useCheckIfBucketEmpty = (bucketName: string) => {
  const s3Client = useS3Client();
  const { data: object, status: objectStatus } = useQuery(
    getObjectsVersions({
      bucketName,
      s3Client,
      queryKey: ['checkIfBucketEmpty', bucketName],
    }),
  );

  const isBucketEmpty = object
    ? Boolean(
        [
          ...(object.Versions ? object.Versions : []),
          ...(object.DeleteMarkers ? object.DeleteMarkers : []),
        ].length,
      )
    : true;

  return {
    isBucketEmpty,
    objectStatus,
  };
};
