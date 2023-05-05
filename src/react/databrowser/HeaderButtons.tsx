import { matchPath, useLocation, useParams } from 'react-router-dom';
import { Button } from '@scality/core-ui/dist/next';
import { ButtonsContainer } from '../ui-elements/Container';
import { listBuckets } from '../actions/s3bucket';
import { listObjects } from '../actions/s3object';
import { useDispatch } from 'react-redux';
import { usePrefixWithSlash } from '../utils/hooks';
import { Icon } from '@scality/core-ui';
import { useQueryClient } from 'react-query';

export function RefreshButton() {
  const params = useParams<{ bucketName?: string }>();
  const { pathname } = useLocation();
  const prefixWithSlash = usePrefixWithSlash();
  const dispatch = useDispatch();
  const isBrowsingObjects = !!matchPath(
    pathname,
    '/accounts/:accountName/buckets/:bucketName/objects',
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
