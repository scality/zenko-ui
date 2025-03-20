import {
  Banner,
  Icon,
  Link,
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
import { ISVList } from '../../ISVList';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { ArtescaLogo } from '../ArtescaLogo';
import { ISVCardConfig } from '../../types';
import { useLocation } from 'react-router';

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
          <Text isEmphazed color="textPrimary">
            Automatic configuration via assistant
          </Text>
          <StyledGrid>
            {ISVList.filter((isv) => isv.assistant === true).map((isv) => {
              return (
                <CardISV
                  name={isv.name}
                  logo={isv.logo}
                  application={isv.application}
                  link={isv.documentationLink}
                  disabledMessage={isv.getDisabledMessage?.()}
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
                />
              );
            })}
          </StyledGrid>
        </Stack>
      </StyledForm>

      <ModalFooter>
        {selectedISV && (
          <Banner variant="base" icon={<Icon name="Info-circle"></Icon>}>
            {selectedISV.assistant ? (
              <Text>
                <Text>
                  The{' '}
                  <Text isEmphazed>
                    {selectedISV.application || selectedISV.name}
                  </Text>{' '}
                  assistant will start to guide you through the configuration
                  process.
                </Text>{' '}
                For more details, you can follow the{' '}
                <Link href={selectedISV.documentationLink} target="_blank">
                  documentation <Icon name="External-link"></Icon>
                </Link>
              </Text>
            ) : (
              <Text>
                You will be redirected to the account page. To be guided through
                the configuration for{' '}
                <Text isEmphazed>
                  {selectedISV.application || selectedISV.name}
                </Text>
                , you can follow the{' '}
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
  const match = url.pathname.match(/accounts\/([^/]+)\/buckets/);
  const accountName = match ? match[1] : null;

  const handleContinueClick = () => {
    if (selectedISV?.assistant) {
      navigate(
        `/isv/configuration?platform=${selectedISV.id}${
          accountName ? `&account=${accountName}` : ''
        }`,
      );
    } else if (accountName) {
      navigate(`/accounts/${accountName}/create-bucket`);
    } else {
      navigate(`/create-account`);
    }
  };

  if (!isOpen) {
    return <></>;
  }

  const continueLabel = !selectedISV
    ? 'Continue'
    : selectedISV?.assistant
    ? 'Continue to assistant'
    : accountName
    ? 'Continue to create bucket'
    : 'Continue to create account';

  return (
    <CustomModal
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
            <Button
              variant="outline"
              label="Skip"
              onClick={() => setIsOpen(false)}
              style={{ width: '80px' }}
            ></Button>
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
      <ISVModalContent
        selectedISV={selectedISV}
        setSelectedISV={setSelectedISV}
      ></ISVModalContent>
    </CustomModal>
  );
};

export default ISVModal;
