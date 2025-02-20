import { useState, JSX } from 'react';
import MiddleEllipsis from './MiddleEllipsis';

import styled from 'styled-components';
import { spacing } from '@scality/core-ui';
const HideContainer = styled.div`
  display: flex;
  align-items: center;
`;
const HideValue = styled.div<{ shown?: boolean }>`
  ${(props) => props.shown && 'width: 15rem;'}
  overflow: hidden;
  text-wrap: nowrap;
`;
const HideAction = styled.div`
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
      <HideValue shown={shown}>
        {shown ? (
          <MiddleEllipsis
            text={credentials}
            tooltipPlacement="top"
            tooltipWidth="21rem"
          />
        ) : (
          '*********'
        )}
      </HideValue>
      <HideAction onClick={() => setShown(!shown)}>
        {shown ? 'Hide' : 'Show'}
      </HideAction>
    </HideContainer>
  );
}

function Hide({
  isHidden,
  children,
}: {
  isHidden: boolean;
  children: JSX.Element;
}) {
  if (isHidden) {
    return null;
  }

  return children;
}

export default Hide;
