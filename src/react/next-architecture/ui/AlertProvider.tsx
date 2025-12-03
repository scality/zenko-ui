import React, { JSX } from 'react';
import {
  Alert,
  FilterLabels,
} from 'shell/compiled-types/src/alerts/services/alertUtils';
import { useXcoreRuntimeConfig } from './ConfigProvider';
import { useShellAlerts } from '@scality/module-federation';

export const highestAlertToStatus = (alerts?: Alert[]): string => {
  return (alerts?.[0] && alerts[0].severity) || 'healthy';
};

export const useAlerts = (filters: FilterLabels) => {
  const { alertHooks } = useShellAlerts();
  return alertHooks.useAlerts(filters);
};

const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const xcoreConfig = useXcoreRuntimeConfig();
  const { AlertsProvider } = useShellAlerts();

  let alertManagerUrl = '/api/alertmanager';
  if (xcoreConfig) {
    alertManagerUrl = xcoreConfig.spec.selfConfiguration.url_alertmanager;
  } else {
    console.log('The alert manager is not available.');
  }

  return (
    <AlertsProvider alertManagerUrl={alertManagerUrl}>
      {children as JSX.Element}
    </AlertsProvider>
  );
};

export default AlertProvider;
