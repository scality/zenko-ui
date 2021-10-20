import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

// TEMPLATE
//
// <Table>
//     <T.Body>
//         <T.Group>
//             <T.GroupName>
//                 General
//             </T.GroupName>
//             <T.GroupContent>
//                 <T.Row>
//                     <T.Key> Name </T.Key>
//                     <T.Value> <Input /> </T.Value>
//                 </T.Row>
//             </T.GroupContent>
//         </T.Group>
//
//         <T.Group>
//             <T.GroupName>
//                 Source
//             </T.GroupName>
//             <T.GroupContent>
//                 <T.Row>
//                     <T.Key> Source Bucket </T.Key>
//                     <T.Value> <Input /> </T.Value>
//                 </T.Row>
//                 <T.Row>
//                     <T.Key> Prefix (optional) </T.Key>
//                     <T.Value> <Input /> </T.Value>
//                 </T.Row>
//             </T.GroupContent>
//         </T.Group>
//     </T.Body>
// </Table>

export const Title = styled.div`
  display: flex;

  text-transform: capitalize;
  margin-bottom: ${spacing.sp24};
  font-size: ${fontSize.larger};
`;

export const Subtitle = styled(Title)`
  font-size: ${fontSize.large};
`;

export const Body = styled.form`
  display: flex;
  flex-direction: column;
`;

export const Groups = styled.div`
  display: flex;
  flex-direction: column;

  max-width: 450px;
`;

export const Group = styled.div`
  margin-bottom: ${spacing.sp8};
`;

export const GroupName = styled.div`
  font-weight: bold;
  margin-bottom: ${spacing.sp8};
`;

export const GroupContent = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Row = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: ${spacing.sp4};
  min-height: ${spacing.sp24};
`;

export const Key = styled.div`
  flex: 1 1 30%;
  color: ${props =>
    props.principal ? props.theme.brand.text : props.theme.brand.textSecondary};
  font-weight: ${props => (props.principal ? 'bold' : 'normal')};
  ${props =>
    props.required
      ? `
        &:after {
            content: '*';
        }
    `
      : ''}
`;

export const Value = styled.div`
  flex: 1 1 70%;
  flex-direction: column;
  i {
    margin-right: ${spacing.sp8};
  }
`;

export const ErrorContainer = styled.div`
  position: absolute;
`;

const Table = styled.div`
  width: 100%;
`;

export const Header = styled.div`
  display: ${props => (props.isRemoved ? 'none' : 'flex')};
  flex-direction: row;
  justify-content: space-between;
`;

export const BannerContainer = styled.div`
  flex: 1;
  margin-right: ${spacing.sp8};
  width: 200px;
  visibility: ${props => (props.isHidden ? 'hidden' : 'visible')};
`;

export const Footer = styled.div`
  display: flex;
  justify-content: flex-end;

  margin: ${spacing.sp8};
`;

export default Table;
