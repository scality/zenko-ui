import { QueryObserverOptions, useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { AppState } from '../../types/state';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';

type ShellNavbarEntry = {
  en: string;
  fr: string;
  groups: string[];
  order: number;
};

type ShellConfig = {
  options: { main: Record<string, ShellNavbarEntry> };
};
function getShellConfigQuery<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TData,
>(
  shellBasePath: string,
): QueryObserverOptions<TQueryFnData, TError, TData, TQueryData> {
  return {
    queryKey: ['shellConfig', shellBasePath],
    queryFn: () => {
      return fetch(`${shellBasePath}`).then((r) => {
        if (!r.ok) {
          throw new Error('shell is not available');
        }
        return r.json();
      });
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  };
}

//TODO grafana url should be retrieved as an explicit field of UI configuration
//instead of guessing it from shell configuration.
export function AuthorizedAdvancedMetricsButton() {
  /// Try to retrieve shell config and guess grafana url from there
  const { data, status: shellConfigStatus } = useQuery({
    ...getShellConfigQuery<
      ShellConfig,
      unknown,
      [string, ShellNavbarEntry] | undefined,
      ShellConfig
    >(`/config-shell.json`),
    select: (shellConfig) => {
      return Object.entries(shellConfig.options.main).find(
        ([, value]) => value.en === 'Overview',
      );
    },
  });

  const grafanaBasePath = `${data?.[0]}/grafana`;
  const cloudServerDashboard =
    'cloudserver-dashboards-745D83ED2CA80412/cloudserver';

  const userGroups = useSelector(
    (state: AppState) => state.oidc.user?.profile?.groups || [],
  );

  return (
    <>
      {shellConfigStatus === 'success' &&
      userGroups.includes('StorageManager') ? (
        <a
          href={`${grafanaBasePath}/d/${cloudServerDashboard}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: spacing.sp8 }}
        >
          <Button
            label="Advanced Metrics"
            variant={'secondary'}
            icon={<i className="fas fa-external-link-alt" />}
          />
        </a>
      ) : (
        ''
      )}
    </>
  );
}
