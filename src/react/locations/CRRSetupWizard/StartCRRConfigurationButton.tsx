import { Button } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useAuthGroups } from '../../utils/hooks';
import { useCRRFeature } from './hooks/useCRRFeature';

type Props = { source?: { accountName: string; bucketName: string } };

export const StartCRRConfigurationButton = ({ source }: Props) => {
  const navigate = useBasenameRelativeNavigate();
  const isCRRWizardEnabled = useCRRFeature();
  const { isStorageManager } = useAuthGroups();
  if (!isCRRWizardEnabled || !isStorageManager) return null;

  const query = source ? `?${new URLSearchParams({ account: source.accountName, bucket: source.bucketName })}` : '';
  return (
    <Button
      label="Start CRR Configuration"
      variant="secondary"
      type="button"
      onClick={() => navigate(`/create-crr-configuration${query}`)}
    />
  );
};
