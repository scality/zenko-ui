// @noflow
import styled, { css } from 'styled-components';
import { Button } from '@scality/core-ui';
import Input from './Input';
import { Link } from 'react-router-dom';

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

export const Icon = styled.i`
  margin-left: 5px;
`;

// * table body
export const Body = styled.tbody`
    // following is needed to display scroll bar onto the table
    display: block;
    overflow: auto;
`;

export const Row = styled(HeadRow)`
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
    white-space: nowrap;
`;

export const CellLink = styled(Link)`
    color: ${props => props.theme.brand.text};
    text-decoration: none;
    &:hover{
        text-decoration: underline;
    }
`;

export const CellA = styled.a`
    color: ${props => props.theme.brand.text};
    text-decoration: none;
    &:hover{
        text-decoration: underline;
    }
`;

// * table search
export const SearchContainer = styled.div`
    display: flex;
    justify-content: space-between;
`;

export const ButtonContainer = styled.div`
    display: flex;
    & > * {
        margin-right: 5px;
    }
`;

export const Search = styled.div`
    display: flex;
    flex: 0 0 220px;
`;

export const SearchInput = styled(Input)`
    background-color: ${props => props.theme.brand.background};
    ${props => {
        return props.active
            ? css`
                border-color: ${props.theme.brand.healthyLight};
              `
            : css`
                border-color: ${props.theme.brand.borderLight};
            `;
    }}

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

export const SearchMetadataContainer = styled.form`
    display: flex;
    margin-top: 10px;
    width: 100%;
    max-width: 600px;
`;

export const SearchMetadataInputAndIcon = styled.div`
    display:flex;
    flex-direction:row;
    flex: 1 0 auto;
    margin-right: 10px;
    align-items: center;
`;

export const SearchInputIcon = styled.i`
    display: ${props => props.visibility? 'block': 'none'};
    margin-left: -25px;
    cursor: pointer;
    &:hover {
      color: ${props => props.theme.brand.base};
    }
`;

export const SearchButton = styled(Button)`
    flex: 0 0 auto;
`;

export const ExtraButton = styled(Button)`
    flex: 0 0 auto;
`;

export const Resizer = styled.div`
    height: 100%;
`;

const Table = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 15px;
`;

export default Table;
