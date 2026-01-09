import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { useSearchParams } from 'react-router';
import { UseFormReturn } from 'react-hook-form';
import { useListAccounts } from '../../next-architecture/domain/business/accounts';
import { useAccessibleAccountsAdapter } from '../../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { NoOpMetricsAdapter } from '../../ui-elements/SelectAccountIAMRole';
import { useIAMUser, IAMUser } from '../hooks/useIAMUser';
import { Account } from '../../next-architecture/domain/entities/account';
import { ISVPlatform, FormData } from '../engine/types';

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
  resetIAMFields: () => void;
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

export const ISVFormProvider = ({
  platform,
  formMethods,
  children,
}: ISVFormProviderProps) => {
  const { setValue, watch } = formMethods;
  const [searchParams] = useSearchParams();
  const paramsAccountName = searchParams.get('account');

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isAccordionExpanded, setIsAccordionExpanded] = useState(false);

  const accountName = watch('accountName');
  const accountNameType = watch('accountNameType');
  const IAMUserName = watch('IAMUserName');

  // Fetch accounts
  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const metricsAdapter = useMemo(() => new NoOpMetricsAdapter(), []);
  const { accounts: accountsResult } = useListAccounts({
    accessibleAccountsAdapter,
    metricsAdapter,
  });

  const accounts = useMemo(() => {
    if (accountsResult.status === 'success') {
      return accountsResult.value.filter(
        (account) => account.name !== 'scality-internal-services',
      );
    }
    return [];
  }, [accountsResult]);

  const accountsStatus = accountsResult.status as AccountsStatus;

  const isAccountExist = useMemo(() => {
    return accounts.some((account) => account.name === accountName);
  }, [accounts, accountName]);

  // IAM User hook
  const {
    isIAMUserExist,
    IAMUsers,
    getIAMUsersMutation,
    accessKeys,
    accessKeysStatus,
  } = useIAMUser({
    IAMUserName,
    onShouldGenerateKey: (shouldGenerateKey) => {
      setValue('generateKey', shouldGenerateKey);
    },
  });

  const iamUsersStatus = getIAMUsersMutation.status as
    | 'idle'
    | 'loading'
    | 'success'
    | 'error';

  // Reset IAM fields
  const resetIAMFields = useCallback(() => {
    setValue('IAMUserName', '');
    setValue('IAMUserNameType', 'create');
    setSelectedAccount(null);
  }, [setValue]);

  // Handle account selection - fetch IAM users
  const onAccountSelected = useCallback(
    (value: string) => {
      setIsAccordionExpanded(false);

      const roleArn = accounts.find(
        (option) => option.name === value,
      )?.preferredAssumableRoleArn;

      getIAMUsersMutation.mutate(roleArn, {
        onSuccess: (data) => {
          if (data.Users.length > 0) {
            setValue('IAMUserNameType', 'existing');
            const user = data.Users.find((user) => user.UserName === value);
            if (user) {
              setValue('IAMUserName', user.UserName);
            } else {
              setIsAccordionExpanded(true);
            }
          } else {
            setValue('IAMUserNameType', 'create');
            setValue('IAMUserName', value);
          }
        },
      });

      const account = accounts.find((option) => option.name === value);
      setSelectedAccount(account ?? null);
    },
    [accounts, getIAMUsersMutation, setValue],
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
  }, [
    paramsAccountName,
    accounts,
    accountNameType,
    getIAMUsersMutation.status,
    onAccountSelected,
  ]);

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

  return (
    <ISVFormContext.Provider value={value}>{children}</ISVFormContext.Provider>
  );
};
