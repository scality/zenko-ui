import { Box } from '@scality/core-ui/dist/next';
import styled from 'styled-components';

export const StatusBox = styled(Box)`
  display: flex;
  gap: 8px;
  align-items: center;
  /* Both callers put this in a table cell whose column has to give way to the action text
     beside it. Without wrapping, the Retry button holds the column open at its own width. */
  flex-wrap: wrap;
`;

export const ErrorText = styled.span`
  color: ${(props) => props.theme.statusCritical};
  font-size: 0.75rem;
`;
