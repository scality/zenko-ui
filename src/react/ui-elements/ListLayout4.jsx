import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

export const ListSection = styled.div`
  display: flex;
  flex: 0 0 1;
  flex-direction: column;

  background-color: ${props => props.theme.brand.backgroundLevel2};
  margin: ${spacing.sp16};
  padding-bottom: ${spacing.sp16};
  padding-top: ${spacing.sp16};
`;
