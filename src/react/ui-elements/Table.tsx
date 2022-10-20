// @noflow
import { fontSize, spacing } from '@scality/core-ui/dist/style/theme';
import { Button } from '@scality/core-ui/dist/next';
import Input from './Input';
import { Link } from 'react-router-dom';
import React from 'react';
import {
  SearchInput as SearchInputCore,
  SecondaryText,
} from '@scality/core-ui';
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
  margin-top: ${spacing.sp20};
  width: 100%;
  height: 100%;
  flex-direction: column;
`;
// * table head
export const Head = styled.thead`
  border-bottom: ${spacing.sp1} solid
    ${(props) => props.theme.brand.backgroundLevel1};
`;
export const HeadRow = styled.tr`
  align-items: center;
  width: 100%;
  cursor: pointer;

  // following is needed to display scroll bar onto the table
  display: table;
  table-layout: fixed;
`;
export const HeadCell = styled.th`
  text-align: left;
  padding: ${spacing.sp16};
`;
export const Icon = styled.i`
  margin-left: ${spacing.sp4};
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
  // it's better to use 1px instead of spacing.sp1, otherwise the border of some rows
  // can look different cause of subpixel positioning
  border-bottom: 1px solid ${(props) => props.theme.brand.backgroundLevel1};
  &:hover {
    background-color: ${(props) => props.theme.brand.secondaryDark1};
  }
  cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
  box-sizing: border-box;
  border-right: ${spacing.sp4} solid transparent;

  ${({ isSelected, theme }) =>
    isSelected &&
    `
        background-color: ${theme.brand.highlight};
        border-right: ${spacing.sp4} solid ${theme.brand.selectedActive};
    `}
`;
export const Cell = styled.td<{ shade?: boolean }>`
  vertical-align: middle;
  color: ${(props) =>
    props.shade ? props.theme.brand.base : props.theme.brand.text};
  padding: ${spacing.sp4} ${spacing.sp16} ${spacing.sp4} ${spacing.sp16};
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;
export const CellLink = styled(Link)`
  color: ${(props) => props.theme.brand.textLink};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;
export const CellClick = styled.span`
  color: ${(props) => props.theme.brand.textLink};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;
export const CellA = styled.a`
  color: ${(props) => props.theme.brand.textLink};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;
// * table search
export const SearchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding-right: ${spacing.sp16};
  padding-left: ${spacing.sp16};

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
export const SearchMetadataContainer = styled.form<{ isHidden?: boolean }>`
  flex: 1 0 auto;
  display: flex;
  max-width: 600px;
  margin-right: ${spacing.sp20};
  visibility: ${(props) => (props.isHidden ? 'hidden' : 'visible')};
`;
export const SearchMetadataInputAndIcon = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex: 1 0 auto;
  margin-right: ${spacing.sp4};
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
  margin-left: ${spacing.sp4};
`;
export const InlineButton = styled(Button)`
  height: ${spacing.sp24};
  margin-left: ${spacing.sp16};
`;
export const AccountSelectorButton = styled(Button)<{ bigButton?: boolean }>`
  height: ${(props) => (props.bigButton ? spacing.sp32 : spacing.sp24)};
`;
export const Title = styled.div`
  font-size: ${fontSize.larger};
  font-weight: bold;
  margin: ${spacing.sp20} 0 ${spacing.sp20} 0;
`;
const Table = styled.table`
  display: flex;
  flex: 1;
  flex-direction: column;
  width: 100%;
  border-collapse: collapse;
`;
// specific to listobject/md search
export const SearchMetadataInput = styled(Input)`
  background-color: ${(props) => props.theme.brand.backgroundLevel1};
  padding: 0px ${spacing.sp32};
  max-height: ${spacing.sp32};
  box-sizing: border-box;
`;
export const ContainerWithSubHeader = styled(Container)`
  margin-top: 0px;
`;
export const SearchInputIcon = styled.i<{ isHidden?: boolean }>`
  position: absolute;
  visibility: ${(props) => (props.isHidden ? 'hidden' : 'visible')};
  right: 10px;
  cursor: pointer;
  &:hover {
    color: ${(props) => props.theme.brand.base};
  }
`;
const ValidationIcon = styled.i`
  position: absolute;
  left: 10px;
  color: ${(props) =>
    props.className === 'fa fa-times'
      ? props.theme.brand.danger
      : props.className === 'fas fa-check'
      ? props.theme.brand.success
      : props.theme.brand.base};
`;
type Props = {
  isMetadataType: boolean;
  isError: boolean;
};
export const SearchValidationIcon = ({ isMetadataType, isError }: Props) => {
  const className = isError
    ? 'fa fa-times'
    : isMetadataType
    ? 'fas fa-check'
    : 'fas fa-search';
  return <ValidationIcon className={className} />;
};
export const SearchButton = styled(Button)`
  flex: 0 0 auto;
`;
export const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding-left: ${spacing.sp16};
  padding-right: ${spacing.sp16};
`;
export const ButtonContainer = styled.div`
  display: flex;
  flex: 0 0 auto;

  & > * {
    margin-left: ${spacing.sp4};
  }
`;
export const SubHeaderContainer = styled.div<{ isHidden?: boolean }>`
  visibility: ${(props) => (props.isHidden ? 'hidden' : 'visible')};
  margin-left: ${spacing.sp4};
`;
export const TableContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
`;
export const GentleEmphaseSecondaryText = styled(SecondaryText)<{
  alignRight?: boolean;
}>`
  font-style: italic;
  ${(props) =>
    props.alignRight
      ? `
    text-align: right;
    display: block;
  `
      : ''}
`;
export default Table;
