import { TextBadge } from './TextBadge';
import { spacing, Stack } from '@scality/core-ui';
import { Box } from '@scality/core-ui/dist/next';
import styled from 'styled-components';
import { fontSize } from '@scality/core-ui/dist/style/theme';
type Props = {
  icon: JSX.Element;
  headTitle: string;
  numInstance: number;
};

export const HeadIcon = styled.i`
  display: flex;
  color: ${(props) => props.theme.brand.infoPrimary};
  background-color: ${(props) => props.theme.brand.backgroundLevel1};
  border-radius: 100%;
  border: ${spacing.f1} solid ${(props) => props.theme.brand.infoPrimary};
  width: 80px;
  height: 80px;
  text-align: center;
  line-height: 80px;
  vertical-align: middle;
  margin-right: ${spacing.f8};
  font-size: ${fontSize.larger};
  align-items: center;
  justify-content: center;
`;

export const HeadTitle = styled.div`
  display: flex;
  color: ${(props) => props.theme.brand.textSecondary};
  font-size: ${fontSize.large};
  align-items: center;
`;
export default function Header({ icon, headTitle, numInstance }: Props) {
  return (
    <Stack>
      <Box display="flex">
        <HeadIcon>{icon}</HeadIcon>
      </Box>
      <HeadTitle>
        {headTitle}
        <TextBadge text={numInstance.toString()} variant="infoPrimary" />
      </HeadTitle>
    </Stack>
  );
}
