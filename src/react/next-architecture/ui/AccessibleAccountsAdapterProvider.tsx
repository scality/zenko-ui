import { createContext, type JSX, useContext } from 'react';
import type { IAccessibleAccounts } from '../adapters/accessible-accounts/IAccessibleAccounts';
import { IAMPensieveAccessibleAccounts } from '../adapters/accessible-accounts/IAMPensieveAccessibleAccounts';
import { noopBasedEventDispatcher } from '../../utils/hooks';

const _AccessibleAccountsAdapterContext = createContext<null | {
  accessibleAccountsAdapter: IAccessibleAccounts;
}>(null);

export const useAccessibleAccountsAdapter = (): IAccessibleAccounts => {
  const context = useContext(_AccessibleAccountsAdapterContext);

  if (!context) {
    throw new Error('The useAccessibleAccountsAdapter hook can only be used within AccessibleAccountsAdapterProvider.');
  }

  return context.accessibleAccountsAdapter;
};

export const AccessibleAccountsAdapterProvider = ({
  children,
  /**
   * DoNotChangePropsWithEventDispatcher is a static props.
   * When set, it must not be changed, otherwise it will break the hook rules.
   */
  DoNotChangePropsWithEventDispatcher = true,
}: {
  children: JSX.Element;
  DoNotChangePropsWithEventDispatcher?: boolean;
}) => {
  const dispatcher = DoNotChangePropsWithEventDispatcher ? undefined : noopBasedEventDispatcher;
  const accessibleAccountsAdapter = new IAMPensieveAccessibleAccounts(dispatcher);

  return (
    <_AccessibleAccountsAdapterContext.Provider value={{ accessibleAccountsAdapter }}>
      {children}
    </_AccessibleAccountsAdapterContext.Provider>
  );
};
