import { Icon } from '@scality/core-ui';
import { Button } from '@scality/core-ui/dist/next';
import { spacing } from '@scality/core-ui/dist/spacing';
import { useBasenameRelativeNavigate } from '@scality/module-federation';
import styled from 'styled-components';

// Fixed size: `Icon` resolves its glyph through a dynamic import and the
// fallback reserves too little width, shifting the title on first paint.
// The left margin keeps the focus outline out of OverallSummary's overflow.
const ArrowButton = styled(Button)`
  width: ${spacing.r40};
  height: ${spacing.r32};
  padding: 0;
  margin-left: ${spacing.r4};
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
