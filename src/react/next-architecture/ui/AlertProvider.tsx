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

export const useAlerts = (filters: FilterLabels) => {
  return window.shellAlerts.hooks.useAlerts(filters);
};
