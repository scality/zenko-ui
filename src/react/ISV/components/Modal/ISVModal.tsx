import { Banner, Icon, Link, Stack, spacing, Text, Wrap } from '@scality/core-ui';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { useState } from 'react';
import { useLocation } from 'react-router';
import styled, { useTheme } from 'styled-components';
import { ISVList } from '../../ISVList';
import { ISV_CATEGORIES, type ISVCardConfig } from '../../types';
import { ArtescaLogo } from '../ArtescaLogo';
import { ISVWideModal } from '../shared/StyledComponents';
import { CardISV } from './CardISV';

export const StyledGrid = styled.div`
  display: grid;
  gap: ${spacing.r8};
  grid-template-columns: repeat(3, minmax(12rem, 1fr));
  grid-auto-rows: 7rem;
  border-radius: ${spacing.f8};
`;

const StyledForm = styled.form`
  background-color: ${(props) => props.theme.backgroundLevel2};
  border-radius: ${spacing.f8};
  overflow-y: auto;
  overflow-x: hidden;
  height: 50vh;
`;

const ModalFooter = styled(Box)`
  display: flex;
  width: 100%;
  height: 64px;
  align-items: center;
`;

const ISVCardWrapper = ({
  isv,
  selectedISV,
  setSelectedISV,
}: {
  isv: ISVCardConfig;
  selectedISV: ISVCardConfig;
  setSelectedISV: (value: ISVCardConfig) => void;
}) => {
  const DisabledMessage = isv.disabledMessage;
  const [isDisabled, setIsDisabled] = useState(false);

  return (
    <CardISV
      name={isv.name}
      logo={isv.logo}
      application={isv.application}
      link={isv.documentationLink}
      disabledMessage={DisabledMessage ? <DisabledMessage onDisabledChange={setIsDisabled} /> : null}
      disabled={isDisabled}
      selected={selectedISV?.id === isv.id}
      onChange={() => setSelectedISV(isv)}
    />
  );
};

export const ISVModalContent = ({
  selectedISV,
  setSelectedISV,
}: {
  selectedISV: ISVCardConfig;
  setSelectedISV: (value: ISVCardConfig) => void;
}) => {
  const theme = useTheme();

  return (
    <Stack direction="vertical" gap="r16">
      <Text isEmphazed variant="Large">
        Which application would you like to configure with your ARTESCA?
      </Text>

      <StyledForm>
        <Stack
          direction="vertical"
          gap="r8"
          style={{
            backgroundColor: theme.backgroundLevel2,
            padding: spacing.r16,
            borderRadius: spacing.f8,
          }}
        >
          {ISV_CATEGORIES.map((category) => {
            const platforms = ISVList.filter((isv) => isv.category === category.id);
            if (platforms.length === 0) return null;
            return (
              <Stack key={category.id} direction="vertical" gap="r8">
                <Text isEmphazed color="textPrimary">
                  {category.label}
                </Text>
                <StyledGrid>
                  {platforms.map((isv) => (
                    <ISVCardWrapper key={isv.id} isv={isv} selectedISV={selectedISV} setSelectedISV={setSelectedISV} />
                  ))}
                </StyledGrid>
              </Stack>
            );
          })}
        </Stack>
      </StyledForm>

      <ModalFooter>
        {selectedISV && (
          <Banner variant="base" icon={<Icon name="Info-circle"></Icon>}>
            {selectedISV.assistant ? (
              <Text>
                <Text>
                  The <Text isEmphazed>{selectedISV.application || selectedISV.name}</Text> assistant will start to
                  guide you through the configuration process.
                </Text>{' '}
                For more details, you can follow the{' '}
                <Link href={selectedISV.documentationLink} target="_blank">
                  documentation <Icon name="External-link"></Icon>
                </Link>
              </Text>
            ) : (
              <Text>
                You will be redirected to the account page. To be guided through the configuration for{' '}
                <Text isEmphazed>{selectedISV.application || selectedISV.name}</Text>, you can follow the{' '}
                <Link href={selectedISV.documentationLink} target="_blank">
                  documentation <Icon name="External-link"></Icon>
                </Link>
              </Text>
            )}
          </Banner>
        )}
      </ModalFooter>
    </Stack>
  );
};

const ISVModal = ({ isOpen, setIsOpen }) => {
  const navigate = useBasenameRelativeNavigate();
  const [selectedISV, setSelectedISV] = useState<ISVCardConfig>(null);
  const url = useLocation();
  const match = url.pathname.match(/accounts\/([^/]+)/);
  const accountName = match ? match[1] : null;

  const handleContinueClick = () => {
    if (selectedISV?.assistant) {
      navigate(`/isv/configuration?platform=${selectedISV.id}${accountName ? `&account=${accountName}` : ''}`);
    } else if (accountName) {
      navigate(`/accounts/${accountName}/buckets/-/create`);
    } else {
      navigate(`/create-account`);
    }
  };

  if (!isOpen) {
    return null;
  }

  const continueLabel = !selectedISV
    ? 'Continue'
    : selectedISV?.assistant
      ? 'Continue to assistant'
      : accountName
        ? 'Continue to create bucket'
        : 'Continue to create account';

  return (
    <ISVWideModal
      title={
        <Stack direction="horizontal" gap="r8">
          <Text variant="Large">Select an ISV</Text> <ArtescaLogo />
        </Stack>
      }
      isOpen={isOpen}
      footer={
        <Wrap>
          <p></p>
          <Stack>
            <Button variant="outline" label="Skip" onClick={() => setIsOpen(false)} style={{ width: '80px' }}></Button>
            <Button
              disabled={!selectedISV}
              variant="primary"
              label={continueLabel}
              icon={<Icon name="Arrow-right"></Icon>}
              onClick={() => handleContinueClick()}
            ></Button>
          </Stack>
        </Wrap>
      }
    >
      <ISVModalContent selectedISV={selectedISV} setSelectedISV={setSelectedISV}></ISVModalContent>
    </ISVWideModal>
  );
};

export default ISVModal;
