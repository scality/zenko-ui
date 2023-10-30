import { useState } from 'react';
import { Icon, Modal, Stack, Text, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import {
  ConfigProvider,
  useConfig,
} from '../../next-architecture/ui/ConfigProvider';
import { VeeamLogo } from './VeeamLogo';
import { ArtescaLogo } from './ArtescaLogo';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';

const CustomModal = styled(Modal)`
  background-color: ${(props) => props.theme.backgroundLevel1};
`;

export const VeeamWelcomeModalInternal = () => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const { features, basePath } = useConfig();
  const history = useHistory();

  if (!features.includes('Veeam')) {
    return <></>;
  }

  return (
    <CustomModal
      isOpen={isOpen}
      title={
        <Stack direction="horizontal" gap="r8">
          <Text variant="Large">Welcome to ARTESCA</Text> <ArtescaLogo />
        </Stack>
      }
      footer={
        <Wrap>
          <p></p>
          <Stack>
            <Button
              variant="outline"
              label={'Skip'}
              onClick={() => {
                setIsOpen(false);
              }}
            />
            <Button
              variant="primary"
              icon={<Icon name="Arrow-right" />}
              label={'Continue'}
              onClick={() => {
                setIsOpen(false);
                history.push(`${basePath}/veeam/configuration`);
              }}
            />
          </Stack>
        </Wrap>
      }
    >
      <Text variant="Basic">
        Get started with <br />
        ARTESCA HW Appliance for
      </Text>{' '}
      <VeeamLogo />
    </CustomModal>
  );
};

export default function VeeamWelcomeModal() {
  return (
    <ConfigProvider>
      <VeeamWelcomeModalInternal />
    </ConfigProvider>
  );
}
