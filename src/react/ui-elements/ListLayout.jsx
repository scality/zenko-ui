import styled from 'styled-components';

// TEMPLATE
//
// <L.Container>
//     <L.ListSection>
//         table
//     </L.ListSection>
//     <L.ContentSection>
//         <L.Head>
//              <L.HeadLeft> ICON </L.HeadLeft>
//              <L.HeadCenter>
//                   <L.HeadTitle> head title </L.HeadTitle>
//              </L.HeadCenter>
//               <L.HeadRight> <Button/> </L.HeadRight>
//         </L.Head>
//         <L.Details>
//             <AccountDetails/>
//         </L.Details>
//     </L.ContentSection>
// </L.Container>

export const Container = styled.div`
    display: flex;
    width: 100%;
    background: ${props => props.theme.brand.background};
    height: calc(100vh - 50px);
`;

export const ListSection = styled.div`
    flex: 0 0 450px;
    flex-direction: column;

    height: calc(100% - 40px);
    background-color: ${props => props.theme.brand.backgroundContrast1};
    margin: 10px 0px 10px 10px;
    padding: 10px;
    border-radius: 5px;
`;

export const ContentSection = styled.div`
    display: flex;
    flex: 0 1 calc(100vw - 450px);
    flex-direction: column;
    margin: 10px;
`;

export const Head = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    min-height: 80px;
    border-radius: 5px;
    padding: 15px;
    background: repeating-radial-gradient(
      circle at 55px 50%,
      #212127,
      #212127 3px,
      #32323a 3px,
      #32323a 15px
    );
`;

export const HeadLeft = styled.div`
  flex: 0 0 auto;
`;

export const HeadCenter = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
`;

export const HeadTitle = styled.div`
  font-size: 19px;
  margin-left: 10px;
`;

export const HeadRight = styled.div`
  display: flex;
  flex: 0 1 auto;

  align-items: center;
`;

export const IconCircle = styled.i`
    display: inline-block;
    border-radius: 40px;
    height: 40px;
    width: 40px;
    font-size: 40px
    padding: 20px;
    color: ${props => props.theme.brand.textSecondary};
    background-color: ${props => props.theme.brand.backgroundContrast1};
`;

export const Details = styled.div`
    display: flex;
    flex-direction: column;
    min-height: calc(100% - 140px);

    padding: 10px;
    margin-top: 10px;
    background-color: ${props => props.theme.brand.backgroundContrast1};
    border-radius: 5px;
`;
