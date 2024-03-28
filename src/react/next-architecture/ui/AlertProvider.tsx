import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorPage500 } from '@scality/core-ui';
import {
  ComponentWithFederatedImports,
  FederatedComponent,
  useCurrentApp,
} from '@scality/module-federation';
import { useConfigRetriever, useDeployedApps } from './ConfigProvider';

type PrometheusAlert = {
  annotations: Record<string, string>;
  receivers: {
    name: string;
  }[];
  fingerprint: string;
  startsAt: string;
  updatedAt: string;
  endsAt: string;
  status: {
    state: 'unprocessed' | 'active' | 'suppressed';
    silencedBy: string[];
    inhibitedBy: string[];
  };
  labels: Record<string, string>;
  generatorURL: string;
};
type AlertLabels = {
  // @ts-expect-error - FIXME when you are working on it
  parents?: string[];
  // @ts-expect-error - FIXME when you are working on it
  selectors?: string[];
  [labelName: string]: string;
};
export type Alert = {
  id: string;
  description: string;
  startsAt: string;
  endsAt: string;
  severity: string;
  labels: AlertLabels;
  originalAlert: PrometheusAlert;
  summary?: string;
  documentationUrl?: string;
};
export const highestAlertToStatus = (alerts?: Alert[]): string => {
  return (alerts?.[0] && alerts[0].severity) || 'healthy';
};
export type FilterLabels = {
  parents?: string[];
  selectors?: string[];
  [labelName: string]: string | string[];
};
const alertGlobal: any = {};
export const useAlerts = (filters: FilterLabels) => {
  return alertGlobal.hooks.useAlerts(filters);
};
export const useHighestSeverityAlerts = (filters: FilterLabels) => {
  return alertGlobal.hooks?.useHighestSeverityAlerts(filters);
};
export const useAlertLibrary = () => {
  return alertGlobal.hooks;
};

const InternalAlertProvider = ({
  moduleExports,
  alertManagerUrl,
  children,
}: {
  moduleExports: {};
  alertManagerUrl: string;
  children;
}) => {
  alertGlobal.hooks = moduleExports['./alerts/alertHooks'];
  const app = useCurrentApp();

  return (
    <FederatedComponent
      module={'./alerts/AlertProvider'}
      scope={'shell'}
      //@ts-ignore
      url={window.shellUIRemoteEntryUrl}
      props={{
        alertManagerUrl,
        children,
      }}
      app={app}
    ></FederatedComponent>
  );
};

function ErrorFallback() {
  return <ErrorPage500 data-cy="sc-error-page500" locale={'en'} />;
}

const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const deployedApps = useDeployedApps();
  const { retrieveConfiguration } = useConfigRetriever();
  const metalk8sUI = deployedApps.find(
    (app: { kind: string }) => app.kind === 'metalk8s-ui',
  );
  const metalk8sUIConfig = retrieveConfiguration({
    configType: 'run',
    name: metalk8sUI.name,
  });

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ComponentWithFederatedImports
        componentWithInjectedImports={InternalAlertProvider}
        renderOnError={<ErrorPage500 />}
        componentProps={{
          children,
          alertManagerUrl:
            metalk8sUIConfig.spec.selfConfiguration.url_alertmanager,
        }}
        federatedImports={[
          {
            scope: 'shell',
            module: './alerts/alertHooks',
            //@ts-ignore
            remoteEntryUrl: window.shellUIRemoteEntryUrl,
          },
        ]}
      />
    </ErrorBoundary>
  );
};

export default AlertProvider;
