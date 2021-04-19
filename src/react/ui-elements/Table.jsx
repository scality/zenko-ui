// @noflow

import { Button, SearchInput as SearchInputCore } from '@scality/core-ui';
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

export const BodyWindowing = styled.tbody`
    flex: 1;
`;

export const Row = styled(HeadRow)`
    &:hover{
      background-color: ${props => props.theme.brand.secondaryDark1};
    }

    ${({ isSelected, theme }) => isSelected && `
        background-color: ${theme.brand.backgroundBluer};
        border-right: 4px solid ${theme.brand.selectedActive};
        box-sizing: border-box;
    `}
`;

export const Cell = styled.td`
    color: ${props => props.shade ? props.theme.brand.base : props.theme.brand.text};
    padding: 0.75rem;
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
    padding-right: 10px;
    padding-left: 10px;
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
    margin-right: 20px;
    visibility: ${props => props.isHidden ? 'hidden' : 'visible'};
`;

export const SearchMetadataInputAndIcon = styled.div`
    position: relative;
    display:flex;
    flex-direction:row;
    flex: 1 0 auto;
    margin-right: 5px;
    align-items: center;
`;

export const ExtraButton = styled(Button)`
    flex: 0 0 auto;
`;

export const Resizer = styled.div`
    height: 100%;
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
    padding-left: 10px;
    padding-right: 10px;
`;

export const ButtonContainer = styled.div`
    display: flex;
    flex: 0 0 auto;

    & > * {
        margin-left: 5px;
    }
`;

export const SubHeaderContainer = styled.div`
    visibility: ${props => props.isHidden ? 'hidden' : 'visible'};
    margin-left: 5px;
`;

export default Table;
