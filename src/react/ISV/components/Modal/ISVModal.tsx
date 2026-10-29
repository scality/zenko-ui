import { Banner, Icon, Link, SearchInput, Stack, spacing, Text, Wrap } from '@scality/core-ui';
import { Box, Button } from '@scality/core-ui/dist/next';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import { type ChangeEvent, useCallback, useState } from 'react';
import { useLocation } from 'react-router';
import styled from 'styled-components';
import { ISVList } from '../../ISVList';
import { ISV_CATEGORIES, type ISVCardConfig } from '../../types';
import { ArtescaLogo } from '../ArtescaLogo';
import { ISVWideModal } from '../shared/StyledComponents';
import { CardISV } from './CardISV';

export const StyledGrid = styled.div`
  display: grid;
  gap: ${spacing.r8};
  /* auto-fill rather than a fixed 3: the modal is sized as a fraction of the window, so
     three 12rem cards stop fitting before the window does and the row overflows its
     scroll area. Filling by available width drops to two cards, then one. The track floor
     is also never under a third of the row, which caps a wide modal at three per row. */
  grid-template-columns: repeat(auto-fill, minmax(max(12rem, (100% - 2 * ${spacing.r8}) / 3), 1fr));
  grid-auto-rows: 8rem;
  border-radius: ${spacing.f8};
`;

const StyledForm = styled.form`
  background-color: ${(props) => props.theme.backgroundLevel2};
  border-radius: ${spacing.f8};
  overflow: hidden;
`;

const ScrollContainer = styled.div`
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100vh - 24rem);
`;

const StickyCategoryTitle = styled.div`
  position: sticky;
  top: 0;
  z-index: 1;
  padding: ${spacing.r8} 0;
  background-color: ${(props) => props.theme.backgroundLevel2};
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
      assistant={isv.assistant}
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
  const [search, setSearch] = useState('');
  const setSearchInputLabel = useCallback((element: HTMLInputElement | null) => {
    element?.setAttribute('aria-label', 'Search ISV');
  }, []);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredISVList = normalizedSearch
    ? ISVList.filter(
        (isv) =>
          isv.name.toLowerCase().includes(normalizedSearch) ||
          (isv.application ?? '').toLowerCase().includes(normalizedSearch),
      )
    : ISVList;

  return (
    <Stack direction="vertical" gap="r16">
      <Stack direction="horizontal" gap="r16" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Text isEmphazed variant="Large">
          Which application would you like to configure with your ARTESCA?
        </Text>

        <SearchInput
          ref={setSearchInputLabel}
          value={search}
          placeholder="Search"
          onChange={(evt: ChangeEvent<HTMLInputElement>) => setSearch(evt.target.value)}
          onReset={() => setSearch('')}
        />
      </Stack>

      <StyledForm>
        <ScrollContainer className="scroll-fade">
          <Stack
            direction="vertical"
            gap="r8"
            style={{
              padding: spacing.r16,
            }}
          >
            {ISV_CATEGORIES.map((category) => {
              const platforms = filteredISVList.filter((isv) => isv.category === category.id);
              if (platforms.length === 0) return null;
              return (
                <Stack key={category.id} direction="vertical" gap="r8">
                  <StickyCategoryTitle>
                    <Text isEmphazed color="textPrimary">
                      {category.label}
                    </Text>
                  </StickyCategoryTitle>
                  <StyledGrid>
                    {platforms.map((isv) => (
                      <ISVCardWrapper
                        key={isv.id}
                        isv={isv}
                        selectedISV={selectedISV}
                        setSelectedISV={setSelectedISV}
                      />
                    ))}
                  </StyledGrid>
                </Stack>
              );
            })}
          </Stack>
        </ScrollContainer>
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
      navigate('/create-account');
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
