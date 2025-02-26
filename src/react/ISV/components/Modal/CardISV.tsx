import { Icon, Link, spacing, Stack, Text } from '@scality/core-ui';
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

const CustomLabel = styled.label<{ selected?: boolean }>`
  position: relative;
  display: flex;
  justify-content: space-between;
  gap: ${spacing.r32};
  padding: ${spacing.r20};
  align-items: flex-start;
  border-radius: ${spacing.f8};
  cursor: pointer;
  background-color: ${(props) =>
    props.selected ? props.theme.highlight : props.theme.backgroundLevel4};
  border: 1px solid
    ${(props) =>
      props.selected ? props.theme.highlight : props.theme.backgroundLevel4};
  min-width: 12rem;
  &:hover {
    border-color: ${(props) => props.theme.textPrimary};
  }
`;

const CustomLink = styled(Link)`
  position: absolute;
  bottom: ${spacing.r10};
  right: ${spacing.r24};
  font-size: 0.875rem;
`;

export const CardISV = (props: CardProps) => {
  const { logo, name, application, onChange, selected, link } = props;
  return (
    <CustomLabel htmlFor={`isv-${name}`} selected={selected}>
      <CardContent logo={logo} application={application} />

      <Input
        style={{ width: 0 }}
        type="radio"
        name="isv"
        value={name}
        id={`isv-${name}`}
        checked={selected}
        onChange={() => onChange(name)}
      />

      <CustomLink href={link} target="_blank">
        Learn more <Icon name="External-link"></Icon>
      </CustomLink>
    </CustomLabel>
  );
};
