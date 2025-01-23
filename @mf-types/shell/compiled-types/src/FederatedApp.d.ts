import React from 'react';
import { QueryClient } from 'react-query';
import { ShellAlerts, ShellHooks } from './hooks/useShellHooks';
import './index.css';
export declare const queryClient: QueryClient;
export type FederatedAppProps = {
    shellHooks: ShellHooks;
    shellAlerts: ShellAlerts;
};
export declare function WithInitFederationProviders({ children, }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export default function App(): import("react/jsx-runtime").JSX.Element;
