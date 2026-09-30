import { Icon } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { BUCKET_LIST_ICON_ONLY_AT } from '@scality/data-browser-library';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useState } from 'react';
import { useIsVeeamVBROnly } from '../hooks/useIsVeeamVBROnly';
import ISVModal from './Modal/ISVModal';

export const StartISVConnectorButton = () => {
  const navigate = useBasenameRelativeNavigate();
  const [isISVModalOpen, setIsISVModalOpen] = useState(false);
  const isVeeamVBROnly = useIsVeeamVBROnly();

  return (
    <>
      <ISVModal isOpen={isISVModalOpen} setIsOpen={setIsISVModalOpen} />
      <Button
        icon={<Icon name="Link" />}
        label={isVeeamVBROnly ? 'Start Veeam VBR Assistant' : 'Start ISV Connector'}
        variant="secondary"
        onClick={() => {
          if (isVeeamVBROnly) {
            navigate('/isv/configuration?platform=veeam-vbr');
          } else {
            setIsISVModalOpen(true);
          }
        }}
        type="button"
        // Collapses with the bucket list's own Create Bucket button rather than on its own
        // threshold: the two sit in the same toolbar, and this label is the longer of the pair.
        iconOnly={BUCKET_LIST_ICON_ONLY_AT}
      />
    </>
  );
};
