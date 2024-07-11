import { fontSize } from '@scality/core-ui/dist/style/theme';

import { spacing, SecondaryText, Wrap } from '@scality/core-ui';
import { Box, Button, Input } from '@scality/core-ui/dist/next';
import { Link } from 'react-router-dom';

import styled from 'styled-components';
import React from 'react';
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
type TableHeaderWrapperProps = {
  search?: React.ReactNode;
  actions?: React.ReactNode;
};

export const TableHeaderWrapper = ({
  search,
  actions,
}: TableHeaderWrapperProps) => {
  return (
    <Wrap padding={spacing.r16}>
      <Box>{search}</Box>
      <Box gap="r16">{actions}</Box>
    </Wrap>
  );
};

export const Container = styled.div`
  display: flex;
  flex: 1;
  margin-top: ${spacing.r16};
  width: 100%;
  height: 100%;
  flex-direction: column;
`;
// * table head
export const Head = styled.thead`
  border-bottom: ${spacing.r1} solid ${(props) => props.theme.backgroundLevel1};
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
  padding: ${spacing.r16};
`;
export const Icon = styled.i`
  margin-left: ${spacing.r4};
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
  // it's better to use 1px instead of spacing.r1, otherwise the border of some rows
  // can look different cause of subpixel positioning
  border-bottom: 1px solid ${(props) => props.theme.backgroundLevel1};
  &:hover {
    background-color: ${(props) => props.theme.backgroundLevel3};
  }
  cursor: ${(props) => (props.onClick ? 'pointer' : 'default')};
  box-sizing: border-box;
  border-right: ${spacing.r4} solid transparent;

  ${(
    //@ts-expect-error fix this when you are working on it
    { isSelected, theme },
  ) =>
    isSelected &&
    `
        background-color: ${theme.highlight};
        border-right: ${spacing.r4} solid ${theme.selectedActive};
    `}
`;
export const Cell = styled.td<{ shade?: boolean }>`
  vertical-align: middle;
  color: ${(props) =>
    props.shade ? props.theme.infoPrimary : props.theme.textPrimary};
  padding: ${spacing.r4} ${spacing.r16} ${spacing.r4} ${spacing.r16};
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;
export const CellLink = styled(Link)`
  color: ${(props) => props.theme.textLink};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;
export const CellClick = styled.span`
  color: ${(props) => props.theme.textLink};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;
export const CellA = styled.a`
  color: ${(props) => props.theme.textLink};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;
// * table search
export const SearchContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding-right: ${spacing.r16};
  padding-left: ${spacing.r16};

  button {
    margin-left: auto;
  }
`;
export const Search = styled.div`
  display: flex;
  flex: 0 0 auto;
`;
export const SearchMetadataContainer = styled.form<{ isHidden?: boolean }>`
  flex: 1 0 auto;
  display: flex;
  max-width: 600px;
  margin-right: ${spacing.r20};
  visibility: ${(props) => (props.isHidden ? 'hidden' : 'visible')};
`;
export const SearchMetadataInputAndIcon = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex: 1 0 auto;
  margin-right: ${spacing.r4};
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
  margin-left: ${spacing.r4};
`;
export const InlineButton = styled(Button)`
  height: ${spacing.r24};
`;
export const AccountSelectorButton = styled(Button)<{ bigButton?: boolean }>`
  height: ${(props) => (props.bigButton ? spacing.r32 : spacing.r24)};
`;
export const Title = styled.div`
  font-size: ${fontSize.larger};
  font-weight: bold;
  margin: ${spacing.r20} 0 ${spacing.r20} 0;
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
  background-color: ${(props) => props.theme.backgroundLevel1};
  padding: 0px ${spacing.r32};
  max-height: ${spacing.r32};
  box-sizing: border-box;
`;
export const ContainerWithSubHeader = styled(Container)`
  height: 100%;
  margin-top: 0px;
`;
export const SearchInputIcon = styled.i<{ isHidden?: boolean }>`
  position: absolute;
  visibility: ${(props) => (props.isHidden ? 'hidden' : 'visible')};
  right: 10px;
  cursor: pointer;
  &:hover {
    color: ${(props) => props.theme.infoPrimary};
  }
`;
const ValidationIcon = styled.i`
  position: absolute;
  left: 10px;
  color: ${(props) =>
    props.className === 'fa fa-times'
      ? props.theme.statusCritical
      : props.className === 'fas fa-check'
      ? props.theme.statusHealthy
      : props.theme.infoSecondary};
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
  padding-left: ${spacing.r16};
  padding-right: ${spacing.r16};
`;
export const ButtonContainer = styled.div`
  display: flex;
  flex: 0 0 auto;

  & > * {
    margin-left: ${spacing.r4};
  }
`;
export const SubHeaderContainer = styled.div<{ isHidden?: boolean }>`
  visibility: ${(props) => (props.isHidden ? 'hidden' : 'visible')};
  margin-left: ${spacing.r4};
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
