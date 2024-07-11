import React from 'react';
import {
  Alert,
  FilterLabels,
} from 'shell/compiled-types/src/alerts/services/alertUtils';
import { useXcoreRuntimeConfig } from './ConfigProvider';

export const highestAlertToStatus = (alerts?: Alert[]): string => {
  return (alerts?.[0] && alerts[0].severity) || 'healthy';
};

export const useAlerts = (filters: FilterLabels) => {
  return window.shellAlerts.hooks.useAlerts(filters);
};

const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const xcoreConfig = useXcoreRuntimeConfig();
  return (
    <window.shellAlerts.AlertsProvider
      alertManagerUrl={xcoreConfig.spec.selfConfiguration.url_alertmanager}
    >
      {children}
    </window.shellAlerts.AlertsProvider>
  );
};

export default AlertProvider;
