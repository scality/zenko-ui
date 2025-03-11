import { Icon, Link, spacing, Stack, Text, Tooltip } from '@scality/core-ui';
import React from 'react';

import styled from 'styled-components';
import Input from '../../../ui-elements/Input';

type CardProps = {
  application?: string;
  logo: React.JSX.Element;
  name: string;
  selected?: boolean;
  onChange?: (value: React.SetStateAction<string>) => void;
  link: string;
  disabledMessage?: React.ReactNode;
};

const CardContent = (props: {
  logo: React.JSX.Element;
  application: string;
}) => {
  const { logo, application } = props;
  return (
    <Stack direction="vertical" gap="r8">
      {logo}
      {application && (
        <Text color="textPrimary" isEmphazed variant="Smaller">
          {application}
        </Text>
      )}
    </Stack>
  );
};

const CustomLabel = styled.label<{ selected?: boolean; disabled?: boolean }>`
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: ${spacing.r32};
  padding: ${spacing.r20};
  align-items: flex-start;
  border-radius: ${spacing.f8};
  background-color: ${(props) =>
    props.selected ? props.theme.highlight : props.theme.backgroundLevel4};
  border: 1px solid
    ${(props) =>
      props.selected ? props.theme.highlight : props.theme.backgroundLevel4};
  &:hover {
    border-color: ${(props) => !props.disabled && props.theme.textPrimary};
  }
  width: 100%;
  height: 100%;
  min-width: 12rem;
  box-sizing: border-box;
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
  div {
    display: flex;
    width: 100%;
    height: 100%;
  }
`;
export const CardISV = (props: CardProps) => {
  const { logo, name, application, onChange, selected, link, disabledMessage } =
    props;
  const isDisabled = !!disabledMessage;

  return (
    <StyledDiv>
      <Tooltip
        overlay={disabledMessage}
        overlayStyle={{
          height: 'fit-content',
          maxWidth: '20rem',
          width: 'fit-content',
        }}
      >
        <CustomLabel
          disabled={isDisabled}
          htmlFor={`isv-${name}`}
          selected={selected}
          aria-disabled={isDisabled}
        >
          <CardContent logo={logo} application={application} />

          <Input
            style={{ width: 0 }}
            type="radio"
            name="isv"
            value={name}
            id={`isv-${name}`}
            checked={selected}
            disabled={isDisabled}
            onChange={() => onChange(name)}
          />
        </CustomLabel>
      </Tooltip>
      <CustomLink href={link} target="_blank">
        Learn more <Icon name="External-link"></Icon>
      </CustomLink>
    </StyledDiv>
  );
};
