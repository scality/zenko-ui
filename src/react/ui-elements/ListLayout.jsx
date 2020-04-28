import styled from 'styled-components';

// https://medium.com/inturn-eng/naming-styled-components-d7097950a245


export const ListContainer = styled.div`
    display: flex;
    width: 100%;
    background: ${props => props.theme.brand.background};
    height: calc(100% - 50px);
`;

export const ListLeftSection = styled.div`
    flex: 0 0 450px;
    flex-direction: column;

    background-color: ${props => props.theme.brand.backgroundContrast1};
    margin: 10px 0px 10px 10px;
    padding: 10px;
    border-radius: 5px;
`;

export const ListRightSection = styled.div`
    display: flex;
    flex: 0 1 calc(100vw - 450px);
    flex-direction: column;

    margin: 10px;
`;

export const ListRightHead = styled.div`
    display: flex;

    height: 100px;
    border-radius: 5px;
    padding: 15px;
    background: repeating-radial-gradient(
      circle at 5% 5%,
      #212127,
      #212127 3px,
      #32323a 3px,
      #32323a 15px
    );
`;

export const ListRightContent = styled.div`
  display: flex;
  flex-direction: column;

  min-height: calc(100vh - 150px);
  margin-top: 10px;
  background-color: ${props => props.theme.brand.backgroundContrast1};
  border-radius: 5px;
  .sc-tabs{
      width: 100%;
  }
  .sc-tabs-item{
      min-width: 100px;
  }
`;
