import { Icon, Link, spacing, Stack, Text } from '@scality/core-ui';
import React from 'react';
import { useTheme } from 'styled-components';

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

export const MoreToCome = (props: { disabled?: boolean }) => {
  const { disabled } = props;
  return (
    <div
      style={{
        borderRadius: spacing.f8,
        display: 'flex',
        alignItems: 'flex-end',
        backgroundColor: disabled
          ? 'rgba(27, 27, 39, 0.5)'
          : 'rgba(27, 27, 39, 1)',
        cursor: 'not-allowed',
        height: '4.5rem',
        padding: spacing.r20,
      }}
    >
      <Text color="textPrimary">More to come...</Text>
    </div>
  );
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
  const theme = useTheme();
  const { logo, application, link } = props;
  return (
    <div
      style={{
        position: 'relative',
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          ...cardContainerStyle,
          backgroundColor: theme.backgroundLevel4,
          opacity: 0.5,
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
      {/* <div
        style={{
          position: 'absolute',
          cursor: 'default',
          top: '1rem',
          right: '-3rem',
          color: 'white',
          width: '10rem',
          textAlign: 'center',

          paddingBlock: spacing.r8,
          backgroundColor: theme.infoSecondary,
          transform: 'rotate(45deg)',
          boxShadow: '0px 4px 4px 0px rgba(0,0,0,0.5)',
        }}
      >
        <Text color="textPrimary" variant="Smaller">
          Manual
        </Text>
      </div> */}
    </div>
  );
};

export const CardISV = (props: CardProps) => {
  const theme = useTheme();
  const { logo, name, application, onChange, selected } = props;
  logo.props.height = 20;
  return (
    <label
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
    </label>
  );
};
