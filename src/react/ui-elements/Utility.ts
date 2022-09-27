import { Property } from 'csstype';
import styled from 'styled-components';
export const TextTransformer = styled.span<{transform: Property.TextTransform}>`
  text-transform: ${(props) => props.transform};
`;
export const TextAligner = styled.div`
  text-align: ${(props) => props.alignment};
`;
export const HideMe = styled.div`
  visibility: ${(props) => (props.isHidden ? 'hidden' : 'visible')};
`;
