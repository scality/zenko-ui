import { Icon, Link, Stack, spacing, Text, Tooltip } from '@scality/core-ui';
import type React from 'react';

import styled from 'styled-components';
import { useDeployedMetalk8sInstances } from '../../../next-architecture/ui/ConfigProvider';
import Input from '../../../ui-elements/Input';

type CardProps = {
  application?: string;
  logo: React.JSX.Element;
  name: string;
  selected?: boolean;
  onChange?: (value: React.SetStateAction<string>) => void;
  link: string;
  disabledMessage?: React.ReactNode;
  disabled?: boolean;
};

const CardContent = (props: { logo: React.JSX.Element; application: string }) => {
  const { logo, application } = props;
  return (
    <Stack direction="vertical" gap="r8" style={{ minWidth: 0 }}>
      {logo}
      {application && (
        <Text color="textPrimary" isEmphazed variant="Smaller">
          {application}
        </Text>
      )}
    </Stack>
  );
};

const CustomLabel = styled.label<{ $selected?: boolean; $disabled?: boolean }>`
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
  cursor: ${(props) => (props.$disabled ? 'not-allowed' : 'pointer')};
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: ${spacing.r32};
  padding: ${spacing.r20};
  align-items: flex-start;
  border-radius: ${spacing.f8};
  background-color: ${(props) => (props.$selected ? props.theme.highlight : props.theme.backgroundLevel4)};
  border: 1px solid
    ${(props) => (props.$selected ? props.theme.highlight : props.theme.backgroundLevel4)};
  &:hover {
    border-color: ${(props) => !props.$disabled && props.theme.textPrimary};
  }
  width: 100%;
  height: 100%;
  /* The grid track already floors the card at 12rem; a second floor here can only sit above
     the track and push the card out of it. */
  min-width: 0;
  box-sizing: border-box;

  /* Each logo carries its own px width, up to 183px, and a percentage max-width alone does
     not let it shrink: that percentage is ignored while a flex or grid item's automatic
     minimum size is computed, so the logo keeps holding the card open at its full width. */
  svg {
    max-width: 100%;
    height: auto;
    min-width: 0;
  }
`;

const CustomLink = styled(Link)`
  position: absolute;
  bottom: ${spacing.r10};
  right: ${spacing.r24};
  font-size: 0.875rem;
`;
const StyledDiv = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  /* This is the grid item, and the boxes below it are flex items. Each one's automatic
     minimum size is its content's — the logo's px width — so every box between the track
     and the logo has to be told it may shrink, or the card spills out of its track. */
  min-width: 0;
  div {
    display: flex;
    width: 100%;
    height: 100%;
    min-width: 0;
  }
`;
export const CardISV = (props: CardProps) => {
  const metalK8sInstances = useDeployedMetalk8sInstances();
  const isMetalk8sInstanceDeployed = metalK8sInstances.length > 0;
  const { logo, name, application, onChange, selected, link, disabledMessage, disabled } = props;
  const isDisabled = disabled ?? false;

  const labelContent = (
    <CustomLabel $disabled={isDisabled} htmlFor={`isv-${name}`} $selected={selected} aria-disabled={isDisabled}>
      <CardContent logo={logo} application={application} />

      <Input
        style={{ width: 0 }}
        type="radio"
        name="isv"
        value={name}
        id={`isv-${name}`}
        checked={selected}
        disabled={isDisabled}
        onChange={() => onChange?.(name)}
      />
    </CustomLabel>
  );

  return (
    <StyledDiv>
      {isDisabled && disabledMessage ? (
        <Tooltip
          overlay={disabledMessage}
          overlayStyle={{
            height: 'fit-content',
            maxWidth: '20rem',
            width: 'fit-content',
          }}
        >
          {labelContent}
        </Tooltip>
      ) : (
        labelContent
      )}
      {isMetalk8sInstanceDeployed && (
        <CustomLink href={link} target="_blank">
          Learn more <Icon name="External-link"></Icon>
        </CustomLink>
      )}
    </StyledDiv>
  );
};
