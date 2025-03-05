import { matchPath, useLocation, useParams } from 'react-router';
import { Button } from '@scality/core-ui/dist/components/buttonv2/Buttonv2.component';
import { ButtonsContainer } from '../ui-elements/Container';
import { listObjects } from '../actions/s3object';
import { useDispatch } from 'react-redux';
import { usePrefixWithSlash } from '../utils/hooks';
import { Icon } from '@scality/core-ui';
import { useQueryClient } from 'react-query';
import { useConfig } from '../next-architecture/ui/ConfigProvider';

export function RefreshButton() {
  const params = useParams<{ bucketName?: string }>();
  const { pathname } = useLocation();
  const prefixWithSlash = usePrefixWithSlash();
  const dispatch = useDispatch();
  const config = useConfig();
  const isBrowsingObjects = !!matchPath(
    config.basePath + '/accounts/:accountName/buckets/:bucketName/objects',
    pathname,
  );
  const queryClient = useQueryClient();

  const handleRefreshClick = () => {
    if (isBrowsingObjects && params.bucketName) {
      dispatch(listObjects(params.bucketName, prefixWithSlash));
    }
    queryClient.invalidateQueries();
  };

  return <Button icon={<Icon name="Sync" />} onClick={handleRefreshClick} />;
}
export default function Buttons() {
  return (
    <ButtonsContainer>
      <RefreshButton />
    </ButtonsContainer>
  );
}
