import {
  Banner,
  Icon,
  InfoMessage,
  Modal,
  spacing,
  Stack,
  Text,
  Wrap,
} from '@scality/core-ui';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { CardISV } from './CardISV';
import { ISVConfig, ISVList } from './ISVList';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { ArtescaLogo } from '../Veeam/ArtescaLogo';

const CustomModal = styled(Modal)`
  background-color: ${(props) => props.theme.backgroundLevel1};
  > div {
    max-width: 60vw;
    width: 60vw;
  }
`;

export const StyledGrid = styled.div`
  display: grid;
  gap: ${spacing.r8};
  grid-template-columns: 1fr 1fr 1fr;
  grid-auto-rows: 7rem;
  border-radius: ${spacing.f8};
`;

export const ISVModalContent = ({
  selectedISV,
  setSelectedISV,
}: {
  selectedISV: ISVConfig;
  setSelectedISV: (value: ISVConfig) => void;
}) => {
  const theme = useTheme();

  return (
    <Stack direction="vertical" gap="r16">
      <Text isEmphazed variant="Large">
        Which application would you like to configure with your ARTESCA?
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
            {ISVList.filter((isv) => isv.assistant === true).map((isv) => {
              return (
                <CardISV
                  name={isv.name}
                  logo={isv.logo}
                  application={isv.type}
                  link={isv.documentationLink}
                  selected={selectedISV?.id === isv.id}
                  onChange={() => setSelectedISV(isv)}
                ></CardISV>
              );
            })}
          </StyledGrid>
          <Text isEmphazed color="textPrimary">
            Manual configuration
          </Text>
          <StyledGrid>
            {ISVList.filter((isv) => isv.assistant !== true).map((isv) => {
              return (
                <CardISV
                  name={isv.name}
                  logo={isv.logo}
                  application={isv.application}
                  link={isv.documentationLink}
                  selected={selectedISV?.id === isv.id}
                  onChange={() => setSelectedISV(isv)}
                ></CardISV>
              );
            })}
          </StyledGrid>
        </Stack>
      </form>

      <Box
        style={{
          display: 'flex',
          width: '100%',
          height: '64px',
          alignItems: 'center',
        }}
      >
        {selectedISV && (
          <Banner variant="base" icon={<Icon name="Info-circle"></Icon>}>
            <Text>
              The documentation for{' '}
              <Text isEmphazed>{selectedISV.type || selectedISV.name}</Text>{' '}
              integration will open in a new tab, and{' '}
              {selectedISV.assistant ? (
                <Text>
                  the{' '}
                  <Text isEmphazed>{selectedISV.type || selectedISV.name}</Text>{' '}
                  assistant will start to guide you through the configuration
                  process.
                </Text>
              ) : (
                `you will be redirected to the account page.`
              )}
            </Text>
          </Banner>
        )}
      </Box>
    </Stack>
  );
};

const ISVModal = ({ isOpen, setIsOpen }) => {
  const navigate = useBasenameRelativeNavigate();
  const [selectedISV, setSelectedISV] = useState<ISVConfig>(null);

  const handleContinueClick = () => {
    window.open(selectedISV.documentationLink, '_blank', 'noopener');
    if (selectedISV?.assistant) {
      navigate(`/isv/configuration?platform=${selectedISV.id}`);
    } else {
      navigate(`/create-account`);
    }
  };

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
              label="Skip"
              onClick={() => setIsOpen(false)}
            ></Button>
            <Button
              disabled={!selectedISV}
              variant="primary"
              label={
                selectedISV?.assistant
                  ? 'Continue to assistant'
                  : 'Continue to create account'
              }
              icon={<Icon name="Arrow-right"></Icon>}
              onClick={() => handleContinueClick()}
            ></Button>
          </Stack>
        </Wrap>
      }
    >
      <ISVModalContent
        selectedISV={selectedISV}
        setSelectedISV={setSelectedISV}
      ></ISVModalContent>
    </CustomModal>
  );
};

export default ISVModal;
