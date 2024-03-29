import { Property } from 'csstype';
import styled from 'styled-components';
export const TextTransformer = styled.span<{
  transform: Property.TextTransform;
}>`
  text-transform: ${(props) => props.transform};
`;

export const TextAligner = styled.div<{ alignment?: string }>`
  text-align: ${(props) => props.alignment};
`;
