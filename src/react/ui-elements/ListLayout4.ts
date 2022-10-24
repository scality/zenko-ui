import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
export const ListSection = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  background-color: ${(props) => props.theme.brand.backgroundLevel2};
  padding: ${spacing.sp16} 0;
`;
