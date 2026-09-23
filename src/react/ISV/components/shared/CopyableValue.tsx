import { ConstrainedText, Wrap } from '@scality/core-ui';
import { CopyButton } from '@scality/core-ui/dist/next';
import styled from 'styled-components';

/**
 * Row holding a summary value next to the button that copies it.
 *
 * The values are unbreakable strings whose length the page does not control -- a service
 * endpoint, an access key, a bucket name -- so a fixed width could neither shrink for them nor
 * stop them spilling out of the field. The cap keeps the intended reading width on a wide form;
 * the two min-widths hand the squeeze to the value's own ellipsis below it.
 *
 * Exported for the rows whose value is not plain text, such as a hidden credential. Everything
 * else should use CopyableValue.
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
