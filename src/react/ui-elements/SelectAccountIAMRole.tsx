import { Stack } from '@scality/core-ui';
import { Select } from '@scality/core-ui/dist/next';
import { IAM } from 'aws-sdk';
import { Bucket } from 'aws-sdk/clients/s3';
import { PropsWithChildren, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
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
import { regexArn } from '../utils/hooks';

class NoOppMetricsAdapter implements IMetricsAdapter {
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

/**
 * DataServiceRoleProvider is using the the path to figure out what is the current account.
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
  const metricsAdapter = new NoOppMetricsAdapter();
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
        <DataServiceRoleProvider DoNotChangePropsWithRedux={false}>
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
  onChange: (account: Account, role: IAM.Role) => void;
  defaultValue?: { accountName: string; roleName: string };
  hideAccountRoles?: { accountName: string; roleName: string }[];
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

  const accountName = account ? account.name : '';
  const rolesQuery = getListRolesQuery(accountName, IAMClient);
  const queryClient = useQueryClient();

  const assumedRoleAccountId = regexArn.exec(assumedRole?.AssumedRoleUser?.Arn)
    ?.groups?.['account_id'];
  const selectedAccountId = regexArn.exec(account?.preferredAssumableRoleArn)
    ?.groups?.['account_id'];

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

  const roles = filterRoles(
    accountName,
    roleQueryData?.data?.Roles ?? [],
    hideAccountRoles,
  );

  const isDefaultAccountSelected = account?.name === defaultValue?.accountName;
  const defaultRole = isDefaultAccountSelected ? defaultValue?.roleName : null;

  return (
    <Stack>
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
        size="1/2"
        placeholder="Select Account"
      >
        {accounts.map((account) => (
          <Select.Option key={`${account.name}`} value={account.name}>
            {account.name}
          </Select.Option>
        ))}
      </Select>

      {roles.length > 0 ? (
        <Select
          id="select-account-role"
          value={role?.RoleName ?? defaultRole}
          onChange={(roleName) => {
            const selectedRole = roles.find(
              (role) => role.RoleName === roleName,
            );
            onChange(account, selectedRole);
            setRole(selectedRole);
          }}
          size="2/3"
          placeholder="Select Role"
        >
          {roles.map((role) => (
            <Select.Option key={`${role.RoleName}`} value={role.RoleName}>
              {role.RoleName}
            </Select.Option>
          ))}
        </Select>
      ) : null}
    </Stack>
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
  const metricsAdapter = new NoOppMetricsAdapter();
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
      />
    );
  } else {
    return <div>Loading accounts...</div>;
  }
};

export const SelectAccountIAMRole = (props: SelectAccountIAMRoleProps) => {
  return (
    <InternalProvider defaultValue={props.defaultValue}>
      <_SelectAccountIAMRole {...props} />
    </InternalProvider>
  );
};
