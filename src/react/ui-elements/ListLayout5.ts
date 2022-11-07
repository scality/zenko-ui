import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;
export const Content = styled.div`
  flex: 1;
  height: 100%;
  background-color: ${(props) => props.theme.brand.backgroundLevel3};
`;
