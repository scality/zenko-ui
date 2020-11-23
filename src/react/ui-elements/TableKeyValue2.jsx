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


export const Body = styled.form`
    display: flex;
    flex-direction: column;
`;

export const Group = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
`;

export const GroupName = styled.div`
    font-weight: bold;
    margin-bottom: 10px;
`;

export const GroupContent = styled.div`
    display: flex;
    flex-direction: column;
`;

export const Row = styled.div`
    display: flex;
    flex-direction: row;
    align-items: baseline;
    margin-bottom: 5px;
    min-height: 25px;
`;

export const Key = styled.div`
    flex: 1 1 40%;
    color: ${props => props.theme.brand.textSecondary};
`;

export const Value = styled.div`
    flex: 1 1 60%;
`;

const Table = styled.div`
    width: 100%;
`;

export default Table;
