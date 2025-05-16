import { useState } from 'react';
import ISVModal from './Modal/ISVModal';
import { Button } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useIsVeeamVBROnly } from '../hooks/useIsVeeamVBROnly';

export const StartISVConnectorButton = () => {
  const navigate = useBasenameRelativeNavigate();
  const [isISVModalOpen, setIsISVModalOpen] = useState(false);
  const isVeeamVBROnly = useIsVeeamVBROnly();

  return (
    <>
      <ISVModal isOpen={isISVModalOpen} setIsOpen={setIsISVModalOpen} />
      <Button
        label={
          isVeeamVBROnly ? 'Start Veeam VBR Assistant' : 'Start ISV Connector'
        }
        variant="secondary"
        onClick={() => {
          if (isVeeamVBROnly) {
            navigate('/isv/configuration?platform=veeam-vbr');
          } else {
            setIsISVModalOpen(true);
          }
        }}
        type="button"
      />
    </>
  );
};
