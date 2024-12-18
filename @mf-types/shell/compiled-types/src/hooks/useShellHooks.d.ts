import { useNotificationCenter } from '../useNotificationCenter';
import { useAlerts, getPlatformAlertSelectors, getNodesAlertSelectors, getVolumesAlertSelectors, getNetworksAlertSelectors, getServicesAlertSelectors, getK8SMasterAlertSelectors, getBootstrapAlertSelectors, getMonitoringAlertSelectors, getAlertingAlertSelectors, getLoggingAlertSelectors, getDashboardingAlertSelectors, getIngressControllerAlertSelectors, getAuthenticationAlertSelectors, useHighestSeverityAlerts } from '../alerts';
import AlertProvider from '../alerts/AlertProvider';
import { useAuthConfig } from '../auth/AuthConfigProvider';
import { useAuth } from '../auth/AuthProvider';
import { useConfig, useConfigRetriever, useDiscoveredViews, useLinkOpener } from '../initFederation/ConfigurationProviders';
import { useShellConfig } from '../initFederation/ShellConfigProvider';
import { useShellThemeSelector } from '../initFederation/ShellThemeSelectorProvider';
import { useDeployedApps } from '../initFederation/UIListProvider';
import { useLanguage } from '../navbar/lang';
export type ShellHooks = {
    useAuthConfig: typeof useAuthConfig;
    useAuth: typeof useAuth;
    useConfigRetriever: typeof useConfigRetriever;
    useDiscoveredViews: typeof useDiscoveredViews;
    useShellConfig: typeof useShellConfig;
    useLanguage: typeof useLanguage;
    useConfig: typeof useConfig;
    useLinkOpener: typeof useLinkOpener;
    useDeployedApps: typeof useDeployedApps;
    useShellThemeSelector: typeof useShellThemeSelector;
    useNotificationCenter: typeof useNotificationCenter;
};
export type ShellAlerts = {
    AlertsProvider: typeof AlertProvider;
    alertHooks: {
        useAlerts: typeof useAlerts;
        useHighestSeverityAlerts: typeof useHighestSeverityAlerts;
    };
    alertSelectors: {
        getPlatformAlertSelectors: typeof getPlatformAlertSelectors;
        getNodesAlertSelectors: typeof getNodesAlertSelectors;
        getVolumesAlertSelectors: typeof getVolumesAlertSelectors;
        getNetworksAlertSelectors: typeof getNetworksAlertSelectors;
        getServicesAlertSelectors: typeof getServicesAlertSelectors;
        getK8SMasterAlertSelectors: typeof getK8SMasterAlertSelectors;
        getBootstrapAlertSelectors: typeof getBootstrapAlertSelectors;
        getMonitoringAlertSelectors: typeof getMonitoringAlertSelectors;
        getAlertingAlertSelectors: typeof getAlertingAlertSelectors;
        getLoggingAlertSelectors: typeof getLoggingAlertSelectors;
        getDashboardingAlertSelectors: typeof getDashboardingAlertSelectors;
        getIngressControllerAlertSelectors: typeof getIngressControllerAlertSelectors;
        getAuthenticationAlertSelectors: typeof getAuthenticationAlertSelectors;
    };
};
export declare const shellHooks: ShellHooks;
export declare const shellAlerts: ShellAlerts;
