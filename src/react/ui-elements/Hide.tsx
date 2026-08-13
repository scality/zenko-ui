import { ConstrainedText, spacing } from '@scality/core-ui';
import { type JSX, useState } from 'react';
import styled from 'styled-components';

const HideContainer = styled.div`
  display: flex;
  align-items: center;
`;
const HideValue = styled.div<{ $shown?: boolean }>`
  /* A definite width of 0 (not a flex-basis) so the shown value contributes nothing to the
     cell's max-content width, then grows into whatever room the cell already had — the
     value can no longer widen its own container, at any root font size. */
  ${(props) => props.$shown && 'width: 0; flex-grow: 1;'}
  overflow: hidden;
`;
const HideAction = styled.div`
  /* Callers put this inside cells that set word-break: break-word, which makes the
     label's min-content one character wide — the flex row then shrinks it and breaks
     "Hide" into "Hid e". */
  flex-shrink: 0;
  white-space: nowrap;
  margin-left: ${spacing.r8};
  color: ${(props) => props.theme.textLink};
  text-decoration: none;
  cursor: pointer;
  &:hover {
    text-decoration: underline;
  }
`;
export function HideCredential({ credentials }: { credentials: string }) {
  const [shown, setShown] = useState(false);
  return (
    <HideContainer>
      <HideValue $shown={shown}>{shown ? <ConstrainedText text={credentials} /> : '*********'}</HideValue>
      <HideAction onClick={() => setShown(!shown)}>{shown ? 'Hide' : 'Show'}</HideAction>
    </HideContainer>
  );
}

function Hide({ isHidden, children }: { isHidden: boolean; children: JSX.Element }) {
  if (isHidden) {
    return null;
  }

  return children;
}

export default Hide;
