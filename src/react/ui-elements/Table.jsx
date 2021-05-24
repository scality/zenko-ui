// @noflow

import { Button, SearchInput as SearchInputCore } from '@scality/core-ui';
import { fontSize, padding } from '@scality/core-ui/dist/style/theme';
import Input from './Input';
import { Link } from 'react-router-dom';
import React from 'react';
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
    flex: 1;
    margin-top: ${padding.large};
    width: 100%;
`;

// * table head
export const Head = styled.thead`
    border-bottom: 1px solid ${props => props.theme.brand.backgroundLevel1};
`;

export const HeadRow = styled.tr`
    align-items: center;
    width:100%;
    cursor: pointer;

    // following is needed to display scroll bar onto the table
    display:table;
    table-layout:fixed;
`;

export const HeadCell = styled.th`
    text-align:left;
    padding: ${padding.base};
`;

export const Icon = styled.i`
  margin-left: ${padding.smaller};
`;

// * table body
export const Body = styled.tbody`
    // following is needed to display scroll bar onto the table
    display: block;
    overflow: auto;
`;

export const BodyWindowing = styled.tbody`
    flex: 1;
`;

export const Row = styled(HeadRow)`
    border-bottom: 1px solid ${props => props.theme.brand.backgroundLevel1};
    &:hover{
      background-color: ${props => props.theme.brand.secondaryDark1};
    }

    ${({ isSelected, theme }) => isSelected && `
        background-color: ${theme.brand.highlight};
        border-right: 4px solid ${theme.brand.selectedActive};
        box-sizing: border-box;
    `}
`;

export const Cell = styled.td`
    color: ${props => props.shade ? props.theme.brand.base : props.theme.brand.text};
    padding: ${padding.base};
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
`;

export const CellLink = styled(Link)`
    color: ${props => props.theme.brand.textLink};
    text-decoration: none;
    &:hover{
        text-decoration: underline;
    }
`;

export const CellClick = styled.span`
    color: ${props => props.theme.brand.textLink};
    text-decoration: none;
    &:hover{
        text-decoration: underline;
    }
`;

export const CellA = styled.a`
    color: ${props => props.theme.brand.textLink};
    text-decoration: none;
    &:hover{
        text-decoration: underline;
    }
`;

// * table search
export const SearchContainer = styled.div`
    display: flex;
    justify-content: space-between;
    padding-right: ${padding.base};
    padding-left: ${padding.base};

    button {
        margin-left: auto;
    }
`;

export const Search = styled.div`
    display: flex;
    flex: 0 0 220px;
`;

export const SearchInput = styled(SearchInputCore)`
    width: 100%;
`;

export const SearchMetadataContainer = styled.form`
    flex: 1 0 auto;
    display: flex;
    max-width: 600px;
    margin-right: ${padding.large};
    visibility: ${props => props.isHidden ? 'hidden' : 'visible'};
`;

export const SearchMetadataInputAndIcon = styled.div`
    position: relative;
    display:flex;
    flex-direction:row;
    flex: 1 0 auto;
    margin-right: ${padding.smaller};
    align-items: center;
`;

export const ExtraButton = styled(Button)`
    flex: 0 0 auto;
`;

export const Resizer = styled.div`
    height: 100%;
`;

export const Actions = styled.div`
    text-align: right;
`;

export const ActionButton = styled(Button)`
    margin-left: ${padding.smaller};
`;

export const Title = styled.div`
    font-size: ${fontSize.larger};
    font-weight: bold;
    margin: ${padding.large} 0 ${padding.large} 0;
`;

const Table = styled.table`
    display: flex;
    flex-direction: column;
    width: 100%;
    border-collapse: collapse;
`;

// specific to listobject/md search

export const SearchMetadataInput = styled(Input)`
    background-color: ${props => props.theme.brand.background};
    padding: 0px 30px;
`;

export const ContainerWithSubHeader = styled(Container)`
    margin-top: 0px;
`;

export const SearchInputIcon = styled.i`
    position: absolute;
    visibility: ${props => props.isHidden ? 'hidden' : 'visible'};
    right: 10px;
    cursor: pointer;
    &:hover {
      color: ${props => props.theme.brand.base};
    }
`;

const ValidationIcon = styled.i`
    position: absolute;
    left: 10px;
    color: ${props => props.className === 'fa fa-times' ? props.theme.brand.danger : props.className === 'fas fa-check' ? props.theme.brand.success: props.theme.brand.base };
`;

type Props = {
    isMetadataType: boolean,
    isError: boolean,
};
export const SearchValidationIcon = ({ isMetadataType, isError }: Props) => {
    const className = isError ? 'fa fa-times' : isMetadataType ? 'fas fa-check' : 'fas fa-search';
    return (
        <ValidationIcon className={className} />
    );
};

export const SearchButton = styled(Button)`
    flex: 0 0 auto;
`;

export const HeaderContainer = styled.div`
    display: flex;
    justify-content: space-between;
    padding-left: ${padding.base};
    padding-right: ${padding.base};
`;

export const ButtonContainer = styled.div`
    display: flex;
    flex: 0 0 auto;

    & > * {
        margin-left: ${padding.smaller};
    }
`;

export const SubHeaderContainer = styled.div`
    visibility: ${props => props.isHidden ? 'hidden' : 'visible'};
    margin-left: ${padding.smaller};
`;

export const TableContainer = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

export default Table;
