import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useSearchParams } from 'react-router';
import { useListAccounts } from '../../next-architecture/domain/business/accounts';
import type { Account } from '../../next-architecture/domain/entities/account';
import { useAccessibleAccountsAdapter } from '../../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { NoOpMetricsAdapter } from '../../ui-elements/SelectAccountIAMRole';
import type { FormData, ISVPlatform } from '../engine/types';
import { type IAMUser, useIAMUser } from '../hooks/useIAMUser';

type AccountsStatus = 'idle' | 'loading' | 'success' | 'error';

type ISVFormContextValue = {
  // Platform
  platform: ISVPlatform;

  // Account state
  accounts: Account[];
  accountsStatus: AccountsStatus;
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account | null) => void;
  isAccountExist: boolean;
  paramsAccountName: string | null;

  // IAM state
  iamUsers: IAMUser[];
  iamUsersStatus: 'idle' | 'loading' | 'success' | 'error';
  isIAMUserExist: boolean;
  fetchIAMUsers: (roleArn: string | undefined) => void;
  accessKeys: string[];
  accessKeysStatus: 'idle' | 'loading' | 'success' | 'error';

  // Accordion state (for IAM section)
  isAccordionExpanded: boolean;
  setIsAccordionExpanded: (expanded: boolean) => void;

  // Actions
  onAccountSelected: (accountName: string) => void;
  resetIAMFields: (mode: 'create' | 'existing', firstAccountName?: string) => void;
};

const ISVFormContext = createContext<ISVFormContextValue | null>(null);

export const useISVFormContext = (): ISVFormContextValue => {
  const context = useContext(ISVFormContext);
  if (!context) {
    throw new Error('useISVFormContext must be used within ISVFormProvider');
  }
  return context;
};

type ISVFormProviderProps = {
  platform: ISVPlatform;
  formMethods: UseFormReturn<FormData>;
  children: ReactNode;
};

export const ISVFormProvider = ({ platform, formMethods, children }: ISVFormProviderProps): JSX.Element => {
  const { setValue, watch, setError, clearErrors } = formMethods;
  const [searchParams] = useSearchParams();
  const paramsAccountName = searchParams.get('account');

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false);

  const accountName = watch('accountName');
  const accountNameType = watch('accountNameType');
  const IAMUserName = watch('IAMUserName');
  const IAMUserNameType = watch('IAMUserNameType');

  // Fetch accounts
  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const metricsAdapter = useMemo(() => new NoOpMetricsAdapter(), []);
  const { accounts: accountsResult } = useListAccounts({
    accessibleAccountsAdapter,
    metricsAdapter,
  });

  const accounts = useMemo(() => {
    if (accountsResult.status === 'success') {
      return accountsResult.value.filter((account) => account.name !== 'scality-internal-services');
    }
    return [];
  }, [accountsResult]);

  const accountsStatus = accountsResult.status as AccountsStatus;

  const isAccountExist = useMemo(() => {
    return accounts.some((account) => account.name === accountName);
  }, [accounts, accountName]);

  // IAM User hook
  const { isIAMUserExist, IAMUsers, getIAMUsersMutation, accessKeys, accessKeysStatus } = useIAMUser({
    IAMUserName,
    onShouldGenerateKey: (shouldGenerateKey) => {
      setValue('generateKey', shouldGenerateKey);
    },
  });

  const iamUsersStatus = getIAMUsersMutation.status as 'idle' | 'loading' | 'success' | 'error';

  // Wire duplicate account name check into react-hook-form
  useEffect(() => {
    if (accountNameType === 'create' && isAccountExist) {
      setError('accountName', { type: 'duplicate', message: 'Account name already exists' });
    } else {
      clearErrors('accountName');
    }
  }, [accountNameType, isAccountExist, setError, clearErrors]);

  // Wire duplicate IAM user name check into react-hook-form
  useEffect(() => {
    if (IAMUserNameType === 'create' && isIAMUserExist) {
      setError('IAMUserName', { type: 'duplicate', message: 'IAM User name already exists' });
    } else {
      clearErrors('IAMUserName');
    }
  }, [IAMUserNameType, isIAMUserExist, setError, clearErrors]);

  // Reset IAM fields
  const resetIAMFields = useCallback(
    (mode: 'create' | 'existing', firstAccountName?: string) => {
      setValue('IAMUserNameType', 'create');
      setSelectedAccount(null);
      if (mode === 'existing' && firstAccountName) {
        setValue('accountName', firstAccountName, { shouldValidate: true });
        // Pre-fill IAMUserName with accountName so the form is valid even if
        // onAccountSelected's async mutate never resolves (e.g. AssumeRole
        // failure). onSuccess will refine this to the actual matching user or
        // Users[0] once IAM users are fetched.
        setValue('IAMUserName', firstAccountName, { shouldValidate: true });
      } else {
        setValue('accountName', '', { shouldValidate: true });
        setValue('IAMUserName', '');
      }
    },
    [setValue],
  );

  const applyIAMUsersToForm = useCallback(
    (users: { UserName: string }[], accountName: string) => {
      if (users.length === 0) {
        setValue('IAMUserNameType', 'create');
        setValue('IAMUserName', accountName);
        return;
      }

      setValue('IAMUserNameType', 'existing');
      const matchingUser = users.find((user) => user.UserName === accountName);
      if (matchingUser) {
        setValue('IAMUserName', matchingUser.UserName);
      } else {
        setValue('IAMUserName', users[0].UserName);
        setIsAccordionExpanded(true);
      }
    },
    [setValue],
  );

  // Handle account selection - fetch IAM users
  const onAccountSelected = useCallback(
    (accountName: string) => {
      setIsAccordionExpanded(false);

      const account = accounts.find((option) => option.name === accountName);
      setSelectedAccount(account ?? null);

      getIAMUsersMutation.mutate(account?.preferredAssumableRoleArn, {
        onSuccess: (data) => applyIAMUsersToForm(data.Users, accountName),
      });
    },
    [accounts, applyIAMUsersToForm, getIAMUsersMutation],
  );

  // Auto-fetch IAM users if account from URL params
  const iamRequestSentRef = useRef(false);
  useEffect(() => {
    if (
      iamRequestSentRef.current ||
      !paramsAccountName ||
      accountNameType !== 'existing' ||
      accounts.length === 0 ||
      getIAMUsersMutation.status === 'loading'
    ) {
      return;
    }

    onAccountSelected(paramsAccountName);
    iamRequestSentRef.current = true;
  }, [paramsAccountName, accounts, accountNameType, getIAMUsersMutation.status, onAccountSelected]);

  const fetchIAMUsers = useCallback(
    (roleArn: string | undefined) => {
      getIAMUsersMutation.mutate(roleArn);
    },
    [getIAMUsersMutation],
  );

  const value: ISVFormContextValue = {
    platform,
    accounts,
    accountsStatus,
    selectedAccount,
    setSelectedAccount,
    isAccountExist,
    paramsAccountName,
    iamUsers: IAMUsers,
    iamUsersStatus,
    isIAMUserExist,
    fetchIAMUsers,
    accessKeys,
    accessKeysStatus,
    isAccordionExpanded,
    setIsAccordionExpanded,
    onAccountSelected,
    resetIAMFields,
  };

  return <ISVFormContext.Provider value={value}>{children}</ISVFormContext.Provider>;
};
