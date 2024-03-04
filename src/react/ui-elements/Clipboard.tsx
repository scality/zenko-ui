import styled from 'styled-components';
import { COPY_STATE_SUCCESS, useClipboard } from '../utils/hooks';
import { IconCopy, IconSuccess } from './Icons';
const Container = styled.span`
  cursor: pointer;
`;

// Todo: Should replace it with the CopyButton form core-ui
export const Clipboard = ({ text }: { text: string }) => {
  const { copy, copyStatus } = useClipboard();
  const isClipboard = Boolean(navigator?.clipboard);
  return (
    <Container>
      {copyStatus === COPY_STATE_SUCCESS ? (
        <IconSuccess name="Check" />
      ) : (
        isClipboard && <IconCopy name="Copy" onClick={() => copy(text)} />
      )}
    </Container>
  );
};
