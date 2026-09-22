import { Modal } from '@scality/core-ui';
import styled from 'styled-components';

export const ListItem = styled.li`
  padding: 0.5rem;
`;

export const ISVWideModal = styled(Modal).attrs({ wide: true })`
  background-color: ${(props) => props.theme.backgroundLevel1};
  > div {
    /* A wide modal's body carries a 480px floor of its own, so a box asked for a flat 60vw
       becomes narrower than the body it holds once the window drops under about 800px: the
       body then spills out of the box for the rest of the way down. The box keeps the floor
       too, and the 90vw cap it already has takes over below a 533px window. */
    width: max(60vw, 480px);
  }
`;
