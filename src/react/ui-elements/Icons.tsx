import React from 'react';
import { Icon } from '@scality/core-ui';

export type IconProps = Parameters<typeof Icon>[0];

export const IconSuccess = (props: IconProps) => {
  return <Icon {...props} color="statusHealthy" />;
};

export const IconCopy = (props: IconProps) => {
  return <Icon {...props} color="textSecondary" />;
};

export const IconQuestionCircle = (props: IconProps) => {
  return <Icon {...props} color="buttonSecondary" />;
};
