import type { PrometheusAlert, AlertLabels } from './alertManager';
import type { StreamValue } from './loki';
export declare const STATUS_WARNING = "warning";
export declare const STATUS_CRITICAL = "critical";
export declare const STATUS_SUCCESS = "success";
export declare const STATUS_NONE = "none";
export declare const STATUS_HEALTH = "healthy";
export declare const STATUS_INFO = "info";
export type Health = 'healthy' | 'warning' | 'critical' | 'none' | 'info';
export type FilterLabels = {
    selectors?: string[];
    [labelName: string]: string | string[];
};
export type Alert = {
    id: string;
    description: string;
    startsAt: string;
    endsAt: string;
    severity: string;
    labels: AlertLabels;
    originalAlert: PrometheusAlert;
    status: string;
    summary?: string;
    documentationUrl?: string;
};
export declare const compareHealth: (status1: any, status2: any) => number;
export declare const removeWarningAlerts: (alerts: Alert[]) => Alert[];
export declare const sortAlerts: (alerts: Alert[]) => Alert[];
export declare const formatActiveAlerts: (alerts: Array<PrometheusAlert>) => Alert[];
export declare const isAlertSelected: (labels: AlertLabels, filters: FilterLabels) => boolean;
export declare const filterAlerts: (alerts: Alert[], filters?: FilterLabels) => Alert[];
export declare const dateIsBetween: (start: string, end: string, date: string) => boolean;
export declare const getHealthStatus: (alerts: Alert[], activeOn?: string) => Health;
export declare const formatHistoryAlerts: (streamValues: StreamValue) => Alert[];