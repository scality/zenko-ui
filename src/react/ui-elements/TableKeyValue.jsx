import { fontSize, padding } from '@scality/core-ui/dist/style/theme';
import styled from 'styled-components';

// TEMPLATE
//
// <Table>
//     <Body>
//         <Row>
//             <Key> key1 </Key>
//             <Value> value1 </Value>
//             <ExtraCell> <Clipboard text="value1"/> </ExtraCell>
//         </Row>
//         <Row>
//             <Key> key2 </Key>
//             <Value> value2 </Value>
//         </Row>
//     </Body>
// </Table>



export const Body = styled.tbody`
`;

export const Row = styled.tr`
`;

export const Key = styled.td`
    padding: ${padding.small} 0px;
    color: ${props => props.theme.brand.textSecondary};
`;

export const Value = styled.td`
    padding-left: 40px;
    width: 400px;
    min-width: 220px;
    word-break: break-word;
`;

export const Title = styled.div`
    font-size: ${fontSize.larger};
    font-weight: bold;
    margin: ${padding.large} 0 ${padding.large} 0;
`;

export const ExtraCell = styled.td`
    padding-left: ${padding.large};
    min-width: 40px;
`;

export const Container = styled.div`
    display: block;
    width: fit-content;
    margin: ${padding.base} 0 0 30px;
`;

const Table = styled.table`
    border-spacing: 0px;
    width: 100%;
`;

export default Table;
