import { Icon, Link, spacing, Stack, Text } from '@scality/core-ui';
import React from 'react';
import styled, { useTheme } from 'styled-components';

type CardProps = {
  application?: string;
  logo: JSX.Element;
  name: string;
  selected?: boolean;
  onChange?: (value: React.SetStateAction<string>) => void;
};

type ManualCardProps = {
  application?: string;
  logo: JSX.Element;
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
};

const CardContent = (props: { logo: JSX.Element; application: string }) => {
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
          backgroundColor: 'rgba(27, 27, 39, 0.5)',
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

const CustomLabel = styled.label`
  &:hover {
    border: 1px solid ${(props) => props.theme.textPrimary};
  }
`;

export const CardISV = (props: CardProps) => {
  const theme = useTheme();
  const { logo, name, application, onChange, selected } = props;
  return (
    <CustomLabel
      htmlFor={`isv-${name}`}
      style={{
        ...cardContainerStyle,
        cursor: 'pointer',
        backgroundColor: selected ? theme.highlight : theme.backgroundLevel4,
      }}
    >
      <CardContent logo={logo} application={application} />

      <input
        style={{
          flex: 'flex-start',
        }}
        type="radio"
        name="isv"
        value={name}
        id={`isv-${name}`}
        checked={selected}
        onChange={() => onChange(name)}
      />
    </CustomLabel>
  );
};
