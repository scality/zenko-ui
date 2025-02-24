import { Icon, Link, spacing, Stack, Text } from '@scality/core-ui';
import React from 'react';

import styled, { useTheme } from 'styled-components';
import Input from '../../../ui-elements/Input';

type CardProps = {
  application?: string;
  logo: React.JSX.Element;
  name: string;
  selected?: boolean;
  onChange?: (value: React.SetStateAction<string>) => void;
  link?: string;
};

type ManualCardProps = {
  application?: string;
  logo: React.JSX.Element;
  link: string;
};

const cardContainerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: spacing.r32,
  padding: spacing.r20,
  height: '4.5rem',
  alignItems: 'flex-start',
  borderRadius: '8px',
  cursor: 'pointer',
};

const CardContent = (props: {
  logo: React.JSX.Element;
  application: string;
}) => {
  const { logo, application } = props;
  return (
    <Stack
      direction="vertical"
      gap="r8"
      style={{
        paddingTop: '0.5rem',
      }}
    >
      {logo}
      {application && (
        <Text color="textPrimary" isEmphazed variant="Smaller">
          {application}
        </Text>
      )}
    </Stack>
  );
};

export const ManualISVCard = (props: ManualCardProps) => {
  const theme = useTheme();
  const { logo, application, link } = props;
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          ...cardContainerStyle,
          backgroundColor: theme.backgroundLevel4,
        }}
      >
        <CardContent logo={logo} application={application}></CardContent>
      </div>
      <Link
        href={link}
        target="_blank"
        style={{
          position: 'absolute',
          bottom: spacing.r10,
          right: spacing.r24,
        }}
      >
        Learn more <Icon name="External-link"></Icon>
      </Link>
    </div>
  );
};

const CustomLabel = styled.label<{ selected?: boolean }>`
  background-color: ${(props) =>
    props.selected ? props.theme.highlight : props.theme.backgroundLevel4};
  border: 1px solid
    ${(props) =>
      props.selected ? props.theme.highlight : props.theme.backgroundLevel4};
  &:hover {
    border-color: ${(props) => props.theme.textPrimary};
  }
  &:focus-visible {
    outline: 1px dashed ${(props) => props.theme.highlight};
  }
`;

export const CardISV = (props: CardProps) => {
  const { logo, name, application, onChange, selected, link } = props;
  return (
    <CustomLabel
      htmlFor={`isv-${name}`}
      style={{
        ...cardContainerStyle,
        position: 'relative',
        overflow: 'hidden',
      }}
      selected={selected}
    >
      <CardContent logo={logo} application={application} />

      <Input
        style={{
          width: 0,
        }}
        type="radio"
        name="isv"
        value={name}
        id={`isv-${name}`}
        checked={selected}
        onChange={() => onChange(name)}
      />
      {link && (
        <Link
          href={link}
          target="_blank"
          style={{
            position: 'absolute',
            bottom: spacing.r10,
            right: spacing.r24,
            fontSize: '0.875rem',
          }}
        >
          Learn more <Icon name="External-link"></Icon>
        </Link>
      )}
    </CustomLabel>
  );
};
