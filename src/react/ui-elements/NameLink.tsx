import { padding} from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

export const NameLinkContaner = styled.div`
  text-decoration: none;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
  padding-right: ${padding.small};
  color: ${(props) => props.theme.brand.selectedActive};
`;