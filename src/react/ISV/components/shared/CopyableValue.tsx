import { ConstrainedText, Wrap } from '@scality/core-ui';
import { CopyButton } from '@scality/core-ui/dist/next';
import styled from 'styled-components';

/**
 * The values are unbreakable strings whose length the page does not control -- an endpoint, an
 * access key, a bucket name -- so a fixed width could neither shrink for them nor stop them
 * spilling out of the field. The cap keeps the reading width; the min-widths hand the squeeze
 * to the value's own ellipsis below it.
 */
export const CopyableValueRow = styled(Wrap)`
  max-width: 20rem;
  align-self: stretch;
  min-width: 0;
  align-items: center;

  > :first-child {
    min-width: 0;
  }
`;

export const CopyableValue = ({ value, copyLabel }: { value: string; copyLabel: string }) => (
  <CopyableValueRow>
    <ConstrainedText text={value} />
    <CopyButton textToCopy={value} aria-label={copyLabel} />
  </CopyableValueRow>
);
