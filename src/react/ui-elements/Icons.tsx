import { Icon } from '@scality/core-ui';
import styled from 'styled-components';

export type IconProps = Parameters<typeof Icon>[0];

export const IconSuccess = (props: IconProps) => {
  return <Icon {...props} color="statusHealthy" />;
};

const Btn = styled.button`
  display: block;
  appearance: none;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
`;

export type IconCopyProps = IconProps & { onClick: () => void };
export const IconCopy = ({ onClick, ...props }: IconCopyProps) => {
  return (
    <Btn onClick={onClick} aria-label="Copy">
      <Icon {...props} color="textSecondary" />
    </Btn>
  );
};

export const IconQuestionCircle = (props: IconProps) => {
  return <Icon {...props} color="buttonSecondary" />;
};
