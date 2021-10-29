import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import { TextBadge as BasicTextBadge } from '@scality/core-ui';
import styled from 'styled-components';

export const TextBadge = styled(BasicTextBadge)`
  padding: ${spacing.sp4} ${spacing.sp4};
  margin: 0 ${spacing.sp8} 0 ${spacing.sp8};
  font-size: ${fontSize.small};
`;
