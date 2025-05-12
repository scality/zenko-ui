import { useState } from 'react';
import ISVModal from './Modal/ISVModal';
import { Button } from '@scality/core-ui/dist/next';
import { useIsVeeamVBROnly } from '../hooks/useIsVeeamVBROnly';

export const StartISVConnectorButton = () => {
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
        onClick={() => setIsISVModalOpen(true)}
        type="button"
      />
    </>
  );
};
