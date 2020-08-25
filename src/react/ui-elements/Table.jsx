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
    border-bottom: 1px solid #424242;
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
      background-color: ${props => props.theme.brand.backgroundBluer};
    }

    ${({ isSelected, theme }) => isSelected && `
        background-color: ${theme.brand.backgroundBluer};
    `}
`;

export const Cell = styled.td`
    padding: 0.75rem;
    text-overflow: ellipsis;
    overflow: hidden;
`;

// * table search
export const SearchContainer = styled.div`
    display: flex;
    justify-content: space-between;
`;

export const Search = styled.div`
    flex: 0 0 220px;
`;

export const SearchInput = styled(Input)`
    width: 100%;
    border-color: ${props => props.theme.brand.borderLight};
    background-color: ${props => props.theme.brand.background};

    // placeholder italics
    ::-webkit-input-placeholder {
       font-style: italic;
    }
    :-moz-placeholder {
       font-style: italic;
    }
    ::-moz-placeholder {
       font-style: italic;
    }
    :-ms-input-placeholder {
       font-style: italic;
    }
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
