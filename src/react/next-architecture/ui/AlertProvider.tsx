import React from 'react';
import { FilterLabels } from 'shell/compiled-types/src/alerts/services/alertUtils';
import { useXcoreConfig } from './ConfigProvider';

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

export const useAlerts = (filters: FilterLabels) => {
  return window.shellAlerts.hooks.useAlerts(filters);
};

const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const xcoreConfig = useXcoreConfig('run');
  return (
    <window.shellAlerts.AlertsProvider
      alertManagerUrl={xcoreConfig.spec.selfConfiguration.url_alertmanager}
    >
      {children}
    </window.shellAlerts.AlertsProvider>
  );
};

export default AlertProvider;
