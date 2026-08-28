import { Stack } from '@scality/core-ui';
import { IconWrapper } from '@scality/core-ui/dist/components/icon/Icon.component';
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
  color: ${(props) => props.theme.textPrimary};
  font-size: ${fontSize.large};
  align-items: center;
`;
export default function Header({ icon, headTitle, numInstance }: Props) {
  return (
    <Stack>
      <IconWrapper $size="2x">{icon}</IconWrapper>
      <HeadTitle>
        {headTitle}
        <TextBadge text={numInstance.toString()} variant="infoPrimary" />
      </HeadTitle>
    </Stack>
  );
}
