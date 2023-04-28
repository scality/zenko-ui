import { createContext, useContext } from 'react';
import { IAccessibleAccounts } from '../adapters/accessible-accounts/IAccessibleAccounts';
import { IAMPensieveAccessibleAccounts } from '../adapters/accessible-accounts/IAMPensieveAccessibleAccounts';

const _AccessibleAccountsAdapterContext = createContext<null | {
  accessibleAccountsAdapter: IAccessibleAccounts;
}>(null);

export const useAccessibleAccountsAdapter = (): IAccessibleAccounts => {
  const context = useContext(_AccessibleAccountsAdapterContext);

  if (!context) {
    throw new Error(
      'The useAccessibleAccountsAdapter hook can only be used within AccessibleAccountsAdapterProvider.',
    );
  }

  return context.accessibleAccountsAdapter;
};

export const AccessibleAccountsAdapterProvider = ({
  children,
}: {
  children: JSX.Element;
}) => {
  // We only need to change to SCUBA Adaptor later on.
  const accessibleAccountsAdapter = new IAMPensieveAccessibleAccounts();
  return (
    <_AccessibleAccountsAdapterContext.Provider
      value={{ accessibleAccountsAdapter }}
    >
      {children}
    </_AccessibleAccountsAdapterContext.Provider>
  );
};
