// @noflow
import { Button } from '@scality/core-ui';
import Input from './Input';
import styled from 'styled-components';

// TEMPLATE
//
// <Table>
//     <T.Head>
//         <T.HeadRow>
//             <T.HeadCell> name </T.HeadCell>
//             <T.HeadCell> age </T.HeadCell>
//         </T.HeadRow>
//     </T.Head>
//     <T.Body>
//         <T.Row>
//             <T.Cell> bart </T.Cell>
//             <T.Cell> 43 </T.Cell>
//         </T.Row>
//         <T.Row>
//             <T.Cell> lisa </T.Cell>
//             <T.Cell> 44 </T.Cell>
//         </T.Row>
//     </T.Body>
// </Table>

export const Container = styled.div`
    display: flex;
    margin-top: 20px;
    width: 100%;
    min-width: 300px;
`;

// * table head
export const Head = styled.thead`
`;

export const HeadRow = styled.tr`
    width:100%;
    cursor: pointer;

    // following is needed to display scroll bar onto the table
    display:table;
    table-layout:fixed;
`;

export const HeadCell = styled.th`
    text-align:left;
    padding: 0.75rem;
`;

// * table body
export const Body = styled.tbody`
    // following is needed to display scroll bar onto the table
    display: block;
    overflow: auto;
`;

export const Row = styled(HeadRow)`
    cursor: pointer;

    &:hover{
      background-color: ${props => props.theme.brand.background};
    }

    ${({ isSelected, theme }) => isSelected && `
        background-color: ${theme.brand.background};
    `}
`;

export const Cell = styled.td`
    border-top: 1px solid #424242;
    padding: 0.75rem;
    text-overflow: ellipsis;
    overflow: hidden;
`;

// * table search
export const Search = styled.div`
    display: flex;
    justify-content: space-between;
`;

export const SearchInput = styled(Input)`
    flex: 0 0 220px;
`;

export const ExtraButton = styled(Button)`
    flex: 0 0 auto;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 15px;
`;

export default Table;
