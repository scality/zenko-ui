import { Icon } from '@scality/core-ui';
import { spacing } from '@scality/core-ui/dist/spacing';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import styled from 'styled-components';

// The box is reserved up front. `Icon` resolves its FontAwesome glyph through a
// dynamic import, and until it lands core-ui's fallback only reserves 1em of
// width where the arrow needs 1.25em, so the title next to it shifted right by
// about 8px on first paint. r40 x r32 is the measured size of the rendered
// 2x arrow.
const IconWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${spacing.r40};
  height: ${spacing.r32};
  flex: none;
  cursor: pointer;

  svg {
    color: ${(props) => props.theme.textPrimary};
    transition: color 0.2s ease;
  }

  &:hover svg {
    color: ${(props) => props.theme.textSecondary};
  }
`;

export default function ArrowNavigation({ path, ariaLabel }: { path: string; ariaLabel: string }) {
  const navigate = useBasenameRelativeNavigate();

  return (
    <IconWrapper onClick={() => navigate(path)}>
      <Icon name="Arrow-left" size={'2x'} ariaLabel={ariaLabel} />
    </IconWrapper>
  );
}
