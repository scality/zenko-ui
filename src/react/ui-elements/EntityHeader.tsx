import { TextBadge } from './TextBadge';
import { Icon, Stack } from '@scality/core-ui';
import styled from 'styled-components';
import { fontSize } from '@scality/core-ui/dist/style/theme';
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
