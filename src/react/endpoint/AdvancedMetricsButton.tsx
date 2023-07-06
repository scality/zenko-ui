import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/style/theme';
import { Icon } from '@scality/core-ui';
import { useGrafanaURL } from '../next-architecture/ui/ConfigProvider';
import { useAuthGroups } from '../utils/hooks';

//TODO grafana url should be retrieved as an explicit field of UI configuration
//instead of guessing it from shell configuration.
export function AuthorizedAdvancedMetricsButton() {
  /// Try to retrieve shell config and guess grafana url from there
  const grafanaURL = useGrafanaURL();

  const cloudServerDashboard =
    'cloudserver-dashboards-745D83ED2CA80412/cloudserver';

  const { isStorageManager } = useAuthGroups();

  return (
    <>
      {isStorageManager ? (
        <a
          href={`${grafanaURL}/d/${cloudServerDashboard}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginLeft: spacing.sp8 }}
        >
          <Button
            label="Advanced Metrics"
            variant={'secondary'}
            icon={<Icon name="External-link" />}
          />
        </a>
      ) : (
        ''
      )}
    </>
  );
}
