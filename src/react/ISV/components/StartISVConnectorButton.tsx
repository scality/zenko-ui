import { Icon } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useState } from 'react';
import { useIsVeeamVBROnly } from '../hooks/useIsVeeamVBROnly';
import ISVModal from './Modal/ISVModal';

// Container width below which this button drops its label. Beside Create Bucket the pair measures
// 343px; 660 leaves the toolbar's left block room for the counter, a 155px search field and the
// refresh button.
const ICON_ONLY_AT = 660;

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
        iconOnly={ICON_ONLY_AT}
      />
    </>
  );
};
