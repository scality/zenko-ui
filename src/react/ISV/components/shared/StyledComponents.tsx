import { Modal } from '@scality/core-ui';
import styled from 'styled-components';

export const ListItem = styled.li`
  padding: 0.5rem;
`;

export const ISVWideModal = styled(Modal)`
  background-color: ${(props) => props.theme.backgroundLevel1};
  > div {
    max-width: 60vw;
    width: 60vw;
  }
`;
