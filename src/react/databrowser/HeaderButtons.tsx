import { matchPath, useLocation, useParams } from 'react-router-dom';
import { Button } from '@scality/core-ui/dist/next';
import { ButtonsContainer } from '../ui-elements/Container';
import { listBuckets } from '../actions/s3bucket';
import { listObjects } from '../actions/s3object';
import { useDispatch } from 'react-redux';
import { usePrefixWithSlash } from '../utils/hooks';

export function RefreshButton() {
  const { bucketName } = useParams<{ bucketName: string }>();
  const { pathname } = useLocation();
  const prefixWithSlash = usePrefixWithSlash();
  const dispatch = useDispatch();
  const isBrowsingObjects = !!matchPath(
    pathname,
    '/accounts/:accountName/buckets/:bucketName/objects',
  );

  const handleRefreshClick = () => {
    if (isBrowsingObjects) {
      dispatch(listObjects(bucketName, prefixWithSlash));
    } else {
      dispatch(listBuckets());
    }
  };

  return (
    <Button icon={<i className="fas fa-sync" />} onClick={handleRefreshClick} />
  );
}
export default function Buttons() {
  return (
    <ButtonsContainer>
      <RefreshButton />
    </ButtonsContainer>
  );
}
