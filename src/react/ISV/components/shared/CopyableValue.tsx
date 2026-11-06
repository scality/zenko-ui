import { ConstrainedText, Wrap } from '@scality/core-ui';
import { CopyButton } from '@scality/core-ui/dist/next';
import styled from 'styled-components';

/**
 * The value is an arbitrarily long, unbreakable string (an endpoint, an access key, a bucket
 * name), which a fixed width would let spill out of the field. The cap plus min-width: 0 hand
 * the squeeze to the value's own ellipsis instead.
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
