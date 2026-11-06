import { Modal } from '@scality/core-ui';
import styled from 'styled-components';

export const ListItem = styled.li`
  padding: 0.5rem;
`;

export const ISVWideModal = styled(Modal).attrs({ wide: true })`
  background-color: ${(props) => props.theme.backgroundLevel1};
  > div {
    /* The body inside carries a 480px floor of its own, so the box has to keep that floor
       too or the body spills out of it; the modal's own 90vw cap takes over below that. */
    width: max(60vw, 480px);
  }
`;
