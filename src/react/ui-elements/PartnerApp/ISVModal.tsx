import { Icon, Modal, spacing, Stack, Text, Wrap } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';

import { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { CardISV, ManualISVCard, MoreToCome } from './CardISV';
import { ISVList, ISVManualList } from './ISVList';

import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { ArtescaLogo } from '../Veeam/ArtescaLogo';

const CustomModal = styled(Modal)`
  background-color: ${(props) => props.theme.backgroundLevel1};
`;

const StyledGrid = styled.div`
  display: grid;
  gap: ${spacing.r8};
  grid-template-columns: 1fr 1fr 1fr;
  grid-auto-rows: 7rem;
  border-radius: ${spacing.f8};
`;

const ISVModal = ({ isOpen, setIsOpen }) => {
  const navigate = useBasenameRelativeNavigate();
  const [selectedISV, setSelectedISV] = useState<string>('');
  const theme = useTheme();

  if (!isOpen) {
    return <></>;
  }
  return (
    <CustomModal
      title={
        <Stack direction="horizontal" gap="r8">
          <Text variant="Large">Welcome to ARTESCA</Text> <ArtescaLogo />
        </Stack>
      }
      isOpen={isOpen}
      footer={
        <Wrap>
          <p></p>
          <Stack>
            <Button
              variant="outline"
              label="Cancel"
              onClick={() => setIsOpen(false)}
            ></Button>
            <Button
              disabled={!selectedISV}
              variant="primary"
              label="Confirm"
              icon={<Icon name="Arrow-right"></Icon>}
              onClick={() =>
                navigate(`/isv/configuration?platform=${selectedISV}`)
              }
            ></Button>
          </Stack>
        </Wrap>
      }
    >
      <Stack direction="vertical" gap="r8">
        <Text isEmphazed variant="Large" style={{ paddingBottom: spacing.r32 }}>
          Which application would you like to configure with your ARTESCA?
        </Text>
        <Text style={{ paddingLeft: spacing.r16 }}>
          Scality provides products that are certified with some of the most
          esteemed applications in the industry.
        </Text>
        <form
          style={{
            backgroundColor: theme.backgroundLevel2,
            borderRadius: spacing.f8,
            overflowY: 'auto',
            overflowX: 'hidden',
            height: '50vh',
          }}
        >
          <Stack
            direction="vertical"
            gap="r8"
            style={{
              backgroundColor: theme.backgroundLevel2,
              padding: spacing.r16,
              borderRadius: spacing.f8,
            }}
          >
            <Text isEmphazed color="textPrimary">
              Automatic configuration via assistant
            </Text>
            <StyledGrid>
              {ISVList.map((isv) => {
                return (
                  <CardISV
                    name={isv.name}
                    logo={isv.logo}
                    application={isv.type}
                    selected={selectedISV === isv.id}
                    onChange={() => setSelectedISV(isv.id)}
                  ></CardISV>
                );
              })}
              <MoreToCome disabled />
            </StyledGrid>
            <Text isEmphazed color="textPrimary">
              Manual configuration
            </Text>
            <StyledGrid>
              {ISVManualList.map((isv) => {
                return (
                  <ManualISVCard
                    logo={isv.logo}
                    application={isv.application}
                    link={isv.documentationLink}
                  ></ManualISVCard>
                );
              })}
              <MoreToCome disabled />
            </StyledGrid>
          </Stack>
        </form>
      </Stack>
    </CustomModal>
  );
};

export default ISVModal;
