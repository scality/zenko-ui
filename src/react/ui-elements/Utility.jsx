import styled from 'styled-components';

export const TextTransformer = styled.span`
    text-transform: ${props => props.transform};
`;

export const TextAligner = styled.div`
    text-align: ${props => props.alignment};
`;
