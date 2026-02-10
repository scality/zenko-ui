import { Icon, Stack } from '@scality/core-ui';
import { fontSize } from '@scality/core-ui/dist/style/theme';
import type { JSX } from 'react';
import styled from 'styled-components';
import { TextBadge } from './TextBadge';

type Props = {
  icon: JSX.Element;
  headTitle: string;
  numInstance: number;
};

export const HeadTitle = styled.div`
  display: flex;
  color: ${(props) => props.theme.textSecondary};
  font-size: ${fontSize.large};
  align-items: center;
`;
export default function Header({ headTitle, numInstance }: Props) {
  return (
    <Stack>
      <Icon name="Account" size="2x" withWrapper />
      <HeadTitle>
        {headTitle}
        <TextBadge text={numInstance.toString()} variant="infoPrimary" />
      </HeadTitle>
    </Stack>
  );
}
