import { Form, FormGroup, FormSection, ToastProvider, useToast } from '@scality/core-ui';
import { Select } from '@scality/core-ui/dist/next';
import type { Bucket } from '@scality/data-browser-library';
import { ShellHooksProvider } from '@scality/module-federation';
import type { IAM } from 'aws-sdk';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useParams } from 'react-router';
import type { ShellAlerts, ShellHooks } from 'shell/compiled-types/src/hooks/useShellHooks';
import DataServiceRoleProvider, { useAssumedRole, useSetAssumedRole } from '../DataServiceRoleProvider';
import { useIAMClient } from '../IAMProvider';
import type { IMetricsAdapter } from '../next-architecture/adapters/metrics/IMetricsAdapter';
import { useListAccounts } from '../next-architecture/domain/business/accounts';
import type { Account } from '../next-architecture/domain/entities/account';
import type { LatestUsedCapacity } from '../next-architecture/domain/entities/metrics';
import {
  AccessibleAccountsAdapterProvider,
  useAccessibleAccountsAdapter,
} from '../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { AccountsLocationsEndpointsAdapterProvider } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { getListRolesQuery } from '../queries';
import { regexArn, SCALITY_IAM_ROLES } from '../utils/hooks';

export class NoOpMetricsAdapter implements IMetricsAdapter {
  async listBucketsLatestUsedCapacity(buckets: Bucket[]): Promise<Record<string, LatestUsedCapacity>> {
    return {};
  }
  async listLocationsLatestUsedCapacity(locationIds: string[]): Promise<Record<string, LatestUsedCapacity>> {
    return {};
  }
  async listAccountLocationsLatestUsedCapacity(
    accountCanonicalId: string,
  ): Promise<Record<string, LatestUsedCapacity>> {
    return {};
  }
  async listAccountsLatestUsedCapacity(accountCanonicalIds: string[]): Promise<Record<string, LatestUsedCapacity>> {
    return {};
  }
}

export const extractAccountIdFromARN = (arn: string) => {
  return regexArn.exec(arn)?.groups?.account_id ?? '';
};

/**
 * Checks if a role's trust policy allows sts:AssumeRoleWithWebIdentity.
 * Roles without this action are incompatible with Web Identity (OIDC/Keycloak) federation.
 */
const isWebIdentityCompatible = (role: IAM.Role): boolean => {
  try {
    const policy = JSON.parse(decodeURIComponent(role.AssumeRolePolicyDocument || '{}'));
    return policy.Statement?.some(
      (statement: { Action?: string | string[] }) =>
        statement.Action === 'sts:AssumeRoleWithWebIdentity' ||
        (Array.isArray(statement.Action) && statement.Action.includes('sts:AssumeRoleWithWebIdentity')),
    );
  } catch {
    return false;
  }
};

const AssumeDefaultIAMRole = ({ defaultValue }: Pick<SelectAccountIAMRoleWithAccountProps, 'defaultValue'>) => {
  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const metricsAdapter = new NoOpMetricsAdapter();
  const accounts = useListAccounts({
    accessibleAccountsAdapter,
    metricsAdapter,
  });
  const setAssumeRole = useSetAssumedRole();

  if (accounts.accounts.status === 'success' && defaultValue) {
    const acc = accounts.accounts.value.find((acc) => acc.name === defaultValue?.accountName);

    /**
     * This set state will trigger a warning because it's not in a useEffect.
     * This is fine because the set state is under an if and it should not be called too many times.
     * The only time it could break is if for some reason the user use an account that is named like
     * INTERNAL_DEFAULT_ACCOUNT_NAME_FOR_INITIALIZATION and use the component with a defaultValue.
     */
    setAssumeRole({
      roleArn: acc?.preferredAssumableRoleArn ?? '',
    });
  }

  return <></>;
};

const InternalProvider = ({
  children,
  defaultValue,
}: PropsWithChildren<Pick<SelectAccountIAMRoleWithAccountProps, 'defaultValue'>>) => {
  return (
    <DataServiceRoleProvider inlineLoader>
      <AccountsLocationsEndpointsAdapterProvider>
        <AccessibleAccountsAdapterProvider DoNotChangePropsWithEventDispatcher={false}>
          <>
            <AssumeDefaultIAMRole defaultValue={defaultValue} />
            {children}
          </>
        </AccessibleAccountsAdapterProvider>
      </AccountsLocationsEndpointsAdapterProvider>
    </DataServiceRoleProvider>
  );
};

type SelectAccountIAMRoleProps = {
  onChange: (account: Account, role: IAM.Role, keycloakRoleName?: string) => void;
  defaultValue?: { accountName: string; roleName: string };
  hideAccountRoles?: { accountName: string; roleName: string }[];
  menuPosition?: 'absolute' | 'fixed';
  identityProviderUrl?: string;
  filterOutInternalRoles?: boolean;
};

type SelectAccountIAMRoleWithAccountProps = SelectAccountIAMRoleProps & {
  accounts: Account[];
  isLoadingAccounts: boolean;
  isError: boolean;
};

const SelectAccountIAMRoleWithAccount = (props: SelectAccountIAMRoleWithAccountProps) => {
  const IAMClient = useIAMClient();
  const setAssumedRole = useSetAssumedRole();
  const { accounts, defaultValue, hideAccountRoles, onChange, isLoadingAccounts, isError } = props;
  const defaultAccountName = useParams<{ accountName: string }>()?.accountName;
  const defaultAccount =
    (defaultAccountName ? accounts.find((account) => account.name === defaultAccountName) : null) ?? null;
  const [account, setAccount] = useState<Account | null>(defaultAccount);
  const [role, setRole] = useState<IAM.Role | null>(null);
  const assumedRole = useAssumedRole();
  const { showToast } = useToast();

  const getIAMRoleMutation = useMutation({
    mutationFn: (roleName: string) => {
      return IAMClient.getRole(roleName);
    },
    onError: (error) => {
      console.error('Error fetching role', error);
      showToast({
        status: 'error',
        open: true,
        autoDismiss: false,
        message: "An error occured while fetching the role's policy.",
      });
    },
  });

  const accountName = account ? account.name : '';
  const rolesQuery = getListRolesQuery(accountName, IAMClient);
  const queryClient = useQueryClient();

  const assumedRoleAccountId = extractAccountIdFromARN(assumedRole?.AssumedRoleUser?.Arn);
  const selectedAccountId = extractAccountIdFromARN(account?.preferredAssumableRoleArn);

  /**
   * When we change account, it will take some time to assume the role for the new account.
   * We need this check to make sure we don't show the roles for the old account.
   */
  const assumedRoleAccountMatchSelectedAccount = assumedRoleAccountId === selectedAccountId;

  const listRolesQuery = {
    ...rolesQuery,
    enabled: !!IAMClient && !!IAMClient.client && accountName !== '' && assumedRoleAccountMatchSelectedAccount,
  };
  const roleQueryData = useQuery(listRolesQuery);

  const roles = props.filterOutInternalRoles
    ? (roleQueryData?.data?.Roles ?? []).filter((role) => {
        return SCALITY_IAM_ROLES.includes(role.RoleName) || !role.Arn.includes('role/scality-internal');
      })
    : (roleQueryData?.data?.Roles ?? []);

  const isDefaultAccountSelected = account?.name === defaultValue?.accountName;
  const defaultRole = isDefaultAccountSelected ? defaultValue?.roleName : null;
  const isRolesLoading = roleQueryData.isLoading || !assumedRoleAccountMatchSelectedAccount;

  return (
    <Form layout={{ kind: 'tab' }}>
      <FormSection>
        <FormGroup
          label="Account"
          id="select-account"
          disabled={isError}
          content={
            <Select
              id="select-account"
              value={isLoadingAccounts ? 'loading-accounts' : (account?.name ?? defaultValue?.accountName)}
              disabled={isLoadingAccounts}
              onChange={(accountName) => {
                const selectedAccount = accounts.find((account) => account.name === accountName);

                setAssumedRole({
                  roleArn: selectedAccount.preferredAssumableRoleArn,
                });

                setAccount(selectedAccount);
                setRole(null);
                queryClient.invalidateQueries(rolesQuery.queryKey);
              }}
              menuPosition={props.menuPosition}
              placeholder="Select Account"
            >
              {isLoadingAccounts ? (
                <Select.Option key="loading-accounts" value="loading-accounts" disabled>
                  Loading accounts...
                </Select.Option>
              ) : (
                accounts.map((account) => (
                  <Select.Option key={`${account.name}`} value={account.name}>
                    {account.name}
                  </Select.Option>
                ))
              )}
            </Select>
          }
        />

        <FormGroup
          label="Role"
          id="select-account-role"
          content={
            <Select
              id="select-account-role"
              value={account ? (isRolesLoading ? 'loading' : (role?.RoleName ?? defaultRole)) : 'no-account'}
              disabled={!account || isRolesLoading}
              onChange={(roleName) => {
                if (!account) return;
                const selectedRole = roles.find((role) => role.RoleName === roleName);
                getIAMRoleMutation.mutate(roleName, {
                  onSuccess: (data) => {
                    const assumeRolePolicyDocument: {
                      Statement?: {
                        Effect: 'Allow' | 'Deny';
                        Principal: { Federated?: string };
                        Action: 'sts:AssumeRoleWithWebIdentity';
                        Condition: {
                          StringEquals: { 'keycloak:roles': string };
                        };
                      }[];
                    } = JSON.parse(decodeURIComponent(data.Role.AssumeRolePolicyDocument));
                    const keycloakRoleName = assumeRolePolicyDocument?.Statement?.find(
                      (statement) =>
                        (props.identityProviderUrl
                          ? statement.Principal?.Federated?.startsWith(props.identityProviderUrl)
                          : true) &&
                        statement.Condition?.StringEquals?.['keycloak:roles'] &&
                        statement.Effect === 'Allow' &&
                        statement.Action === 'sts:AssumeRoleWithWebIdentity',
                    )?.Condition?.StringEquals['keycloak:roles'];
                    onChange(account, selectedRole, keycloakRoleName);
                  },
                });
                setRole(selectedRole);
              }}
              menuPosition={props.menuPosition}
              placeholder="Select Role"
            >
              {!account ? (
                <Select.Option key="no-account" value="no-account" disabled>
                  Please select an account
                </Select.Option>
              ) : isRolesLoading ? (
                <Select.Option key="loading" value="loading" disabled>
                  Loading Roles...
                </Select.Option>
              ) : (
                roles.map((role) => {
                  const isAlreadyAttached = hideAccountRoles.find(
                    (hideRole) => hideRole.accountName === accountName && hideRole.roleName === role.RoleName,
                  );
                  if (isAlreadyAttached) {
                    return (
                      <Select.Option
                        key={`${role.RoleName}`}
                        value={role.RoleName}
                        disabled
                        disabledReason="Role already attached"
                      >
                        {role.RoleName}
                      </Select.Option>
                    );
                  }
                  if (!isWebIdentityCompatible(role)) {
                    return (
                      <Select.Option
                        key={`${role.RoleName}`}
                        value={role.RoleName}
                        disabled
                        disabledReason="Incompatible: Requires sts:AssumeRoleWithWebIdentity"
                      >
                        {role.RoleName}
                      </Select.Option>
                    );
                  }
                  return (
                    <Select.Option key={`${role.RoleName}`} value={role.RoleName}>
                      {role.RoleName}
                    </Select.Option>
                  );
                })
              )}
            </Select>
          }
        />
      </FormSection>
    </Form>
  );
};

const defaultOnChange = () => ({});
export const _SelectAccountIAMRole = (props: SelectAccountIAMRoleProps) => {
  const { onChange = defaultOnChange, hideAccountRoles = [], defaultValue } = props;

  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const metricsAdapter = new NoOpMetricsAdapter();
  const accounts = useListAccounts({
    accessibleAccountsAdapter,
    metricsAdapter,
  });
  const { showToast } = useToast();
  const accountsList = accounts.accounts.status === 'success' ? accounts.accounts.value : [];
  const isLoadingAccounts = accounts.accounts.status === 'loading';
  const isError = accounts.accounts.status === 'error';

  // biome-ignore lint/correctness/useExhaustiveDependencies: We want to show the error toast only when the accounts status changes
  useEffect(() => {
    if (accounts.accounts.status === 'error') {
      showToast({
        status: 'error',
        open: true,
        autoDismiss: false,
        message: accounts.accounts.reason,
      });
    }
  }, [accounts.accounts.status, showToast]);

  return (
    <SelectAccountIAMRoleWithAccount
      accounts={accountsList}
      defaultValue={defaultValue}
      hideAccountRoles={hideAccountRoles}
      onChange={onChange}
      menuPosition={props.menuPosition}
      filterOutInternalRoles={props.filterOutInternalRoles}
      identityProviderUrl={props.identityProviderUrl}
      isLoadingAccounts={isLoadingAccounts}
      isError={isError}
    />
  );
};

export const SelectAccountIAMRoleInternal = (props: SelectAccountIAMRoleProps) => {
  return (
    <InternalProvider defaultValue={props.defaultValue}>
      <_SelectAccountIAMRole {...props} />
    </InternalProvider>
  );
};

export default function SelectAccountIAMRole(
  props: SelectAccountIAMRoleProps & {
    shellAlerts: ShellAlerts;
    shellHooks: ShellHooks;
  },
) {
  return (
    <ShellHooksProvider shellAlerts={props.shellAlerts} shellHooks={props.shellHooks}>
      <ToastProvider>
        <SelectAccountIAMRoleInternal {...props} />
      </ToastProvider>
    </ShellHooksProvider>
  );
}
