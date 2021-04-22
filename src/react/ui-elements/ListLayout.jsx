import { fontSize, padding } from '@scality/core-ui/dist/style/theme';
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
    background: ${props => props.theme.brand.backgroundLevel1};
    flex:1;
`;

export const ListSection = styled.div`
    display: flex;
    flex: 0 0 450px;
    min-width: 450px;
    flex-direction: column;

    background-color: ${props => props.theme.brand.backgroundLevel2};
    margin: ${padding.small} 0px ${padding.small} ${padding.small};
    padding-bottom: ${padding.base};
    padding-top: ${padding.base};
`;

export const ContentSection = styled.div`
    display: flex;
    flex: 0 1 calc(100vw - 450px);
    flex-direction: column;
    margin: ${padding.small};
    margin-left: 1px;
`;

export const Head = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    min-height: 80px;
    padding: ${padding.base};
    background-color: ${props => props.theme.brand.backgroundLevel3};
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
  font-size: ${fontSize.larger};
  margin-left: ${padding.small};
`;

export const HeadRight = styled.div`
  display: flex;
  flex: 0 1 auto;

  align-items: center;
`;

export const IconCircle = styled.i`
    color: ${props => props.theme.brand.statusHealthy};
    background-color: ${props => props.theme.brand.backgroundLevel1};
    border-radius: 100%;
    border: 1px solid ${props => props.theme.brand.infoPrimary};
    width: 80px;
    height: 80px;
    text-align: center;
    line-height: 80px;
    vertical-align: middle;
    margin-right: ${padding.base};
    font-size: 32px;
`;

export const Details = styled.div`
    display: flex;
    flex: 1;

    margin-top: 2px;
`;
