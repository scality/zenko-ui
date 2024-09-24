import { Form, FormGroup, FormSection, Stack } from '@scality/core-ui';
import { Select } from '@scality/core-ui/dist/next';
import { IAM } from 'aws-sdk';
import { Bucket } from 'aws-sdk/clients/s3';
import { PropsWithChildren, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { MemoryRouter, Route, useHistory, useParams } from 'react-router-dom';
import DataServiceRoleProvider, {
  useAssumedRole,
  useSetAssumedRole,
} from '../DataServiceRoleProvider';
import { useIAMClient } from '../IAMProvider';
import { IMetricsAdapter } from '../next-architecture/adapters/metrics/IMetricsAdapter';
import { useListAccounts } from '../next-architecture/domain/business/accounts';
import { Account } from '../next-architecture/domain/entities/account';
import { LatestUsedCapacity } from '../next-architecture/domain/entities/metrics';
import {
  AccessibleAccountsAdapterProvider,
  useAccessibleAccountsAdapter,
} from '../next-architecture/ui/AccessibleAccountsAdapterProvider';
import { AccountsLocationsEndpointsAdapterProvider } from '../next-architecture/ui/AccountsLocationsEndpointsAdapterProvider';
import { getListRolesQuery } from '../queries';
import { SCALITY_INTERNAL_ROLES, regexArn } from '../utils/hooks';

class NoOpMetricsAdapter implements IMetricsAdapter {
  async listBucketsLatestUsedCapacity(
    buckets: Bucket[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    return {};
  }
  async listLocationsLatestUsedCapacity(
    locationIds: string[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    return {};
  }
  async listAccountLocationsLatestUsedCapacity(
    accountCanonicalId: string,
  ): Promise<Record<string, LatestUsedCapacity>> {
    return {};
  }
  async listAccountsLatestUsedCapacity(
    accountCanonicalIds: string[],
  ): Promise<Record<string, LatestUsedCapacity>> {
    return {};
  }
}

const filterRoles = (
  accountName: string,
  roles: IAM.Role[],
  hideAccountRoles: { accountName: string; roleName: string }[],
) => {
  return roles.filter(
    (role) =>
      !hideAccountRoles.find(
        (hideRole) =>
          hideRole.accountName === accountName &&
          hideRole.roleName === role.RoleName,
      ),
  );
};

export const extractAccountIdFromARN = (arn: string) => {
  return regexArn.exec(arn)?.groups?.['account_id'] ?? '';
};

/**
 * DataServiceRoleProvider is using the path to figure out what is the current account.
 * In order to reuse this logic, we need to have a router and set DataServiceRoleProvider under
 * the path /accounts/:accountName
 * Without this INTERNAL_DEFAULT_ACCOUNT_NAME_FOR_INITIALIZATION, it won't render.
 *
 * We assume the user won't have an account with this name.
 */
const INTERNAL_DEFAULT_ACCOUNT_NAME_FOR_INITIALIZATION =
  '__INTERNAL_DEFAULT_ACCOUNT_NAME_FOR_INITIALIZATION__';

const AssumeDefaultIAMRole = ({
  defaultValue,
}: Pick<SelectAccountIAMRoleWithAccountProps, 'defaultValue'>) => {
  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const metricsAdapter = new NoOpMetricsAdapter();
  const accounts = useListAccounts({
    accessibleAccountsAdapter,
    metricsAdapter,
  });
  const history = useHistory();
  const setAssumeRole = useSetAssumedRole();

  const isInternalDefaultAccountSelected =
    history.location.pathname ===
    '/accounts/' + INTERNAL_DEFAULT_ACCOUNT_NAME_FOR_INITIALIZATION;

  if (
    accounts.accounts.status === 'success' &&
    defaultValue &&
    isInternalDefaultAccountSelected
  ) {
    const acc = accounts.accounts.value.find(
      (acc) => acc.name === defaultValue?.accountName,
    );

    /**
     * This set state will trigger a warning because it's not in a useEffect.
     * This is fine because the set state is under an if and it should not be called too many times.
     * The only time it could break is if for some reason the user use an account that is named like
     * INTERNAL_DEFAULT_ACCOUNT_NAME_FOR_INITIALIZATION and use the component with a defaultValue.
     */
    setAssumeRole({
      roleArn: acc?.preferredAssumableRoleArn ?? '',
    });
    history.replace('/accounts/' + defaultValue?.accountName);
  }

  return <></>;
};

const InternalProvider = ({
  children,
  defaultValue,
}: PropsWithChildren<
  Pick<SelectAccountIAMRoleWithAccountProps, 'defaultValue'>
>) => {
  return (
    <MemoryRouter
      initialEntries={[
        `/accounts/${INTERNAL_DEFAULT_ACCOUNT_NAME_FOR_INITIALIZATION}`,
      ]}
    >
      <Route path="/accounts/:accountName">
        <DataServiceRoleProvider DoNotChangePropsWithRedux={false} inlineLoader>
          <AccountsLocationsEndpointsAdapterProvider>
            <AccessibleAccountsAdapterProvider
              DoNotChangePropsWithEventDispatcher={false}
            >
              <>
                <AssumeDefaultIAMRole defaultValue={defaultValue} />
                {children}
              </>
            </AccessibleAccountsAdapterProvider>
          </AccountsLocationsEndpointsAdapterProvider>
        </DataServiceRoleProvider>
      </Route>
    </MemoryRouter>
  );
};

type SelectAccountIAMRoleProps = {
  onChange: (
    account: Account,
    role: IAM.Role,
    keycloakRoleName: string,
  ) => void;
  defaultValue?: { accountName: string; roleName: string };
  hideAccountRoles?: { accountName: string; roleName: string }[];
  menuPosition?: 'absolute' | 'fixed';
  identityProviderUrl?: string;
  filterOutInternalRoles?: boolean;
};

type SelectAccountIAMRoleWithAccountProps = SelectAccountIAMRoleProps & {
  accounts: Account[];
};

const SelectAccountIAMRoleWithAccount = (
  props: SelectAccountIAMRoleWithAccountProps,
) => {
  const history = useHistory();
  const IAMClient = useIAMClient();
  const setAssumedRole = useSetAssumedRole();
  const { accounts, defaultValue, hideAccountRoles, onChange } = props;
  const defaultAccountName = useParams<{ accountName: string }>().accountName;
  const defaultAccount =
    accounts.find((account) => account.name === defaultAccountName) ?? null;
  const [account, setAccount] = useState<Account | null>(defaultAccount);
  const [role, setRole] = useState<IAM.Role | null>(null);
  const assumedRole = useAssumedRole();

  const getIAMRoleMutation = useMutation({
    mutationFn: (roleName: string) => {
      return IAMClient.getRole(roleName);
    },
  });

  const accountName = account ? account.name : '';
  const rolesQuery = getListRolesQuery(accountName, IAMClient);
  const queryClient = useQueryClient();

  const assumedRoleAccountId = extractAccountIdFromARN(
    assumedRole?.AssumedRoleUser?.Arn,
  );
  const selectedAccountId = extractAccountIdFromARN(
    account?.preferredAssumableRoleArn,
  );

  /**
   * When we change account, it will take some time to assume the role for the new account.
   * We need this check to make sure we don't show the roles for the old account.
   */
  const assumedRoleAccountMatchSelectedAccount =
    assumedRoleAccountId === selectedAccountId;

  const listRolesQuery = {
    ...rolesQuery,
    enabled:
      !!IAMClient &&
      !!IAMClient.client &&
      accountName !== '' &&
      assumedRoleAccountMatchSelectedAccount,
  };
  const roleQueryData = useQuery(listRolesQuery);

  const allRolesExceptHiddenOnes = filterRoles(
    accountName,
    roleQueryData?.data?.Roles ?? [],
    hideAccountRoles,
  );
  const roles = props.filterOutInternalRoles
    ? allRolesExceptHiddenOnes.filter((role) => {
        return (
          SCALITY_INTERNAL_ROLES.includes(role.RoleName) ||
          !role.Arn.includes('role/scality-internal')
        );
      })
    : allRolesExceptHiddenOnes;

  const isDefaultAccountSelected = account?.name === defaultValue?.accountName;
  const defaultRole = isDefaultAccountSelected ? defaultValue?.roleName : null;

  return (
    <Form layout={{ kind: 'tab' }}>
      <FormSection>
        <FormGroup
          label="Account"
          id="select-account"
          content={
            <Select
              id="select-account"
              value={account?.name ?? defaultValue?.accountName}
              onChange={(accountName) => {
                const selectedAccount = accounts.find(
                  (account) => account.name === accountName,
                );

                setAssumedRole({
                  roleArn: selectedAccount.preferredAssumableRoleArn,
                });
                history.push(`/accounts/${accountName}`);

                setAccount(selectedAccount);
                setRole(null);
                queryClient.invalidateQueries(rolesQuery.queryKey);
              }}
              menuPosition={props.menuPosition}
              placeholder="Select Account"
            >
              {accounts.map((account) => (
                <Select.Option key={`${account.name}`} value={account.name}>
                  {account.name}
                </Select.Option>
              ))}
            </Select>
          }
        />

        <FormGroup
          label="Role"
          id="select-account-role"
          content={
            roles.length > 0 ? (
              <Select
                id="select-account-role"
                value={role?.RoleName ?? defaultRole}
                onChange={(roleName) => {
                  const selectedRole = roles.find(
                    (role) => role.RoleName === roleName,
                  );
                  getIAMRoleMutation.mutate(roleName, {
                    onSuccess: (data) => {
                      const assumeRolePolicyDocument: {
                        Statement: {
                          Effect: 'Allow' | 'Deny';
                          Principal: { Federated?: string };
                          Action: 'sts:AssumeRoleWithWebIdentity';
                          Condition: {
                            StringEquals: { ['keycloak:roles']: string };
                          };
                        }[];
                      } = JSON.parse(
                        decodeURIComponent(data.Role.AssumeRolePolicyDocument),
                      );
                      const keycloakRoleName =
                        assumeRolePolicyDocument.Statement.find(
                          (statement) =>
                            (props.identityProviderUrl
                              ? statement.Principal?.Federated?.startsWith(
                                  props.identityProviderUrl,
                                )
                              : true) &&
                            statement.Condition.StringEquals[
                              'keycloak:roles'
                            ] &&
                            statement.Effect === 'Allow' &&
                            statement.Action ===
                              'sts:AssumeRoleWithWebIdentity',
                        ).Condition.StringEquals['keycloak:roles'];
                      onChange(account, selectedRole, keycloakRoleName);
                    },
                  });
                  setRole(selectedRole);
                }}
                menuPosition={props.menuPosition}
                placeholder="Select Role"
              >
                {roles.map((role) => (
                  <Select.Option key={`${role.RoleName}`} value={role.RoleName}>
                    {role.RoleName}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <Select
                id="select-account-role"
                value={'Please select an account'}
                disabled
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onChange={() => {}}
                menuPosition={props.menuPosition}
                placeholder="Select Role"
              >
                <Select.Option value={'Please select an account'}>
                  Please select an account
                </Select.Option>
              </Select>
            )
          }
        />
      </FormSection>
    </Form>
  );
};

const defaultOnChange = () => ({});
export const _SelectAccountIAMRole = (props: SelectAccountIAMRoleProps) => {
  const {
    onChange = defaultOnChange,
    hideAccountRoles = [],
    defaultValue,
  } = props;

  const accessibleAccountsAdapter = useAccessibleAccountsAdapter();
  const metricsAdapter = new NoOpMetricsAdapter();
  const accounts = useListAccounts({
    accessibleAccountsAdapter,
    metricsAdapter,
  });

  if (accounts.accounts.status === 'success') {
    return (
      <SelectAccountIAMRoleWithAccount
        accounts={accounts.accounts.value}
        defaultValue={defaultValue}
        hideAccountRoles={hideAccountRoles}
        onChange={onChange}
        menuPosition={props.menuPosition}
        filterOutInternalRoles={props.filterOutInternalRoles}
        identityProviderUrl={props.identityProviderUrl}
      />
    );
  } else {
    return <div>Loading accounts...</div>;
  }
};

export const SelectAccountIAMRoleInternal = (
  props: SelectAccountIAMRoleProps,
) => {
  return (
    <InternalProvider defaultValue={props.defaultValue}>
      <_SelectAccountIAMRole {...props} />
    </InternalProvider>
  );
};

export default function SelectAccountIAMRole(props: SelectAccountIAMRoleProps) {
  return <SelectAccountIAMRoleInternal {...props} />;
}
