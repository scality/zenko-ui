import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorPage500 } from '@scality/core-ui';
import {
  ComponentWithFederatedImports,
  FederatedComponent,
  useCurrentApp,
} from '@scality/module-federation';
import { useConfigRetriever, useDeployedApps } from './ConfigProvider';
import { QueryObserverResult } from 'react-query';

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
  parents: string[];
  selectors?: string[];
} & { [labelName: string]: string };
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
} & { [labelName: string]: string };

type useAlertsType = (
  filters: FilterLabels,
) => Omit<QueryObserverResult<Alert[]>, 'data'> & { alerts?: Alert[] };
const alertGlobal: { hooks?: { useAlerts: useAlertsType } } = {};

export const useAlerts = (filters: FilterLabels) => {
  return alertGlobal.hooks.useAlerts(filters);
};

const InternalAlertProvider = ({
  moduleExports,
  alertManagerUrl,
  children,
}: {
  moduleExports: {
    './alerts/alertHooks': { useAlerts: useAlertsType };
  };
  alertManagerUrl: string;
  children;
}) => {
  alertGlobal.hooks = moduleExports['./alerts/alertHooks'];
  const app = useCurrentApp();

  return (
    <FederatedComponent
      module={'./alerts/AlertProvider'}
      scope={'shell'}
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

  const metalk8sUIConfig = metalk8sUI
    ? retrieveConfiguration({
        configType: 'run',
        name: metalk8sUI.name,
      })
    : {
        spec: {
          selfConfiguration: {
            url_alertmanager: '',
          },
        },
      };

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
            remoteEntryUrl: window.shellUIRemoteEntryUrl,
          },
        ]}
      />
    </ErrorBoundary>
  );
};

export default AlertProvider;
