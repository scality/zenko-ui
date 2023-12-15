import { useState } from 'react';
import MiddleEllipsis from './MiddleEllipsis';
import { spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';
const HideContainer = styled.div`
  display: flex;
`;
const HideValue = styled.div<{ shown?: boolean }>`
  ${(props) => props.shown && 'width: 260px;'}
`;
const HideAction = styled.div`
  margin-left: ${spacing.sp8};
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
