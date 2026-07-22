import { Box } from '@scality/core-ui/dist/next';
import styled from 'styled-components';

export const StatusBox = styled(Box)`
  display: flex;
  gap: 8px;
  align-items: center;
`;

export const ErrorText = styled.span`
  color: ${(props) => props.theme.statusCritical};
  font-size: 0.75rem;
`;
