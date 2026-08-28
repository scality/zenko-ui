import { Icon } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/spacing';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import styled from 'styled-components';

// core-ui's Button with an icon and neither label nor variant is already the
// bare icon button we need: transparent, no border, and it handles hover and
// focus-visible. Being a real button, it is also reachable by keyboard, which a
// styled div with an onClick is not. core-ui requires a string tooltip on an
// icon-only button and uses it as the accessible name.
//
// The box is sized explicitly because `Icon` resolves its FontAwesome glyph
// through a dynamic import, and until it lands core-ui's fallback only reserves
// 1em of width where the arrow needs 1.25em, so the title next to it shifted
// right on first paint. r40 x r32 is the measured size of the rendered 2x arrow.
const ArrowButton = styled(Button)`
  width: ${spacing.r40};
  height: ${spacing.r32};
  padding: 0;
  flex: none;
`;

export default function ArrowNavigation({ path, label }: { path: string; label: string }) {
  const navigate = useBasenameRelativeNavigate();

  return (
    <ArrowButton
      icon={<Icon name="Arrow-left" size={'2x'} />}
      onClick={() => navigate(path)}
      tooltip={{ overlay: label }}
    />
  );
}
