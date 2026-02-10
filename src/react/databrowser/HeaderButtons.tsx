import { Icon } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { useListObjects } from '@scality/data-browser-library';
import { matchPath, useLocation, useParams } from 'react-router';
import { useConfig } from '../next-architecture/ui/ConfigProvider';
import { ButtonsContainer } from '../ui-elements/Container';
import { usePrefixWithSlash } from '../utils/hooks';

export function RefreshButton() {
  const params = useParams<{ bucketName?: string }>();
  const { pathname } = useLocation();
  const prefixWithSlash = usePrefixWithSlash();
  const config = useConfig();
  const isBrowsingObjects = !!matchPath(
    config.basePath + '/accounts/:accountName/buckets/:bucketName/objects',
    pathname,
  );

  const { refetch } = useListObjects({
    Bucket: params.bucketName || '',
    Prefix: prefixWithSlash,
  });

  const handleRefreshClick = () => {
    if (isBrowsingObjects && params.bucketName) {
      refetch();
    }
  };

  return <Button icon={<Icon name="Sync" />} tooltip={{ overlay: 'Refresh data browser', placement: 'right' }} onClick={handleRefreshClick} />;
}
export default function Buttons() {
  return (
    <ButtonsContainer>
      <RefreshButton />
    </ButtonsContainer>
  );
}
